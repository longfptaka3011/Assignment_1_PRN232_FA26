using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Sprints.DTOs;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Sprints.Queries.GetSprintsByProject;

public record GetSprintsByProjectQuery(Guid ProjectId, SprintStatus? Status = null) : IRequest<List<SprintDto>>;

public class GetSprintsByProjectQueryHandler : IRequestHandler<GetSprintsByProjectQuery, List<SprintDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSprintsByProjectQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<SprintDto>> Handle(GetSprintsByProjectQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Sprints
            .AsNoTracking()
            .Where(s => s.ProjectId == request.ProjectId && s.DeletedAt == null);

        if (request.Status.HasValue)
        {
            query = query.Where(s => s.Status == request.Status.Value);
        }

        var sprints = await query
            .Include(s => s.Issues.Where(i => i.DeletedAt == null))
                .ThenInclude(i => i.Status)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new SprintDto
            {
                Id = s.Id,
                ProjectId = s.ProjectId,
                Name = s.Name,
                Goal = s.Goal,
                Status = s.Status,
                StartDate = s.StartDate,
                EndDate = s.EndDate,
                CompletedAt = s.CompletedAt,
                IssueCount = s.Issues.Count,
                TotalStoryPoints = s.Issues.Sum(i => i.StoryPoints ?? 0),
                CompletedStoryPoints = s.Issues.Where(i => i.Status.IsCompletedStatus).Sum(i => i.StoryPoints ?? 0),
                CreatedAt = s.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return sprints;
    }
}
