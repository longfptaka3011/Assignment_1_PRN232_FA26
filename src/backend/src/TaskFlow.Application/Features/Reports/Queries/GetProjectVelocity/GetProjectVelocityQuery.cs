using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Reports.DTOs;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Reports.Queries.GetProjectVelocity;

public record GetProjectVelocityQuery(Guid ProjectId) : IRequest<List<SprintVelocityDto>>;

public class GetProjectVelocityQueryHandler : IRequestHandler<GetProjectVelocityQuery, List<SprintVelocityDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IProjectAuthorizationService _projectAuthService;

    public GetProjectVelocityQueryHandler(
        IApplicationDbContext context,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _projectAuthService = projectAuthService;
    }

    public async Task<List<SprintVelocityDto>> Handle(GetProjectVelocityQuery request, CancellationToken cancellationToken)
    {
        await _projectAuthService.EnsureRoleAsync(
            request.ProjectId,
            new[] { ProjectRole.Owner, ProjectRole.Admin, ProjectRole.Member, ProjectRole.Viewer },
            cancellationToken);

        var sprints = await _context.Sprints
            .AsNoTracking()
            .Where(s => s.ProjectId == request.ProjectId && s.DeletedAt == null)
            .OrderBy(s => s.StartDate ?? s.CreatedAt)
            .Include(s => s.Issues.Where(i => i.DeletedAt == null))
                .ThenInclude(i => i.Status)
            .ToListAsync(cancellationToken);

        return sprints.Select(s =>
        {
            var committed = s.Issues.Sum(i => i.StoryPoints ?? 0m);
            var completed = s.Issues.Where(i => i.Status.IsCompletedStatus).Sum(i => i.StoryPoints ?? 0m);

            return new SprintVelocityDto
            {
                SprintId = s.Id,
                SprintName = s.Name,
                CommittedStoryPoints = committed,
                CompletedStoryPoints = completed,
                CompletedAt = s.CompletedAt
            };
        }).ToList();
    }
}
