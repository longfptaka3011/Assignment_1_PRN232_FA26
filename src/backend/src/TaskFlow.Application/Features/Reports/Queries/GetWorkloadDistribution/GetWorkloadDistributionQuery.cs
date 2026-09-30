using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Reports.DTOs;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Reports.Queries.GetWorkloadDistribution;

public record GetWorkloadDistributionQuery(Guid ProjectId, Guid? SprintId = null) : IRequest<List<MemberWorkloadDto>>;

public class GetWorkloadDistributionQueryHandler : IRequestHandler<GetWorkloadDistributionQuery, List<MemberWorkloadDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IProjectAuthorizationService _projectAuthService;

    public GetWorkloadDistributionQueryHandler(
        IApplicationDbContext context,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _projectAuthService = projectAuthService;
    }

    public async Task<List<MemberWorkloadDto>> Handle(GetWorkloadDistributionQuery request, CancellationToken cancellationToken)
    {
        await _projectAuthService.EnsureRoleAsync(
            request.ProjectId,
            new[] { ProjectRole.Owner, ProjectRole.Admin, ProjectRole.Member, ProjectRole.Viewer },
            cancellationToken);

        var query = _context.Issues
            .AsNoTracking()
            .Include(i => i.Status)
            .Include(i => i.Assignee)
            .Where(i => i.ProjectId == request.ProjectId && i.DeletedAt == null);

        if (request.SprintId.HasValue)
        {
            query = query.Where(i => i.SprintId == request.SprintId.Value);
        }

        var issues = await query.ToListAsync(cancellationToken);

        // Group by Assignee
        var groups = issues.GroupBy(i => i.AssigneeId);

        var result = new List<MemberWorkloadDto>();

        foreach (var group in groups)
        {
            var first = group.First();
            var totalPts = group.Sum(i => i.StoryPoints ?? 0m);
            var completedPts = group.Where(i => i.Status.IsCompletedStatus).Sum(i => i.StoryPoints ?? 0m);
            var completedCount = group.Count(i => i.Status.IsCompletedStatus);

            result.Add(new MemberWorkloadDto
            {
                UserId = group.Key,
                UserName = group.Key.HasValue ? (first.Assignee?.FullName ?? "Unassigned") : "Unassigned",
                UserAvatarUrl = group.Key.HasValue ? first.Assignee?.AvatarUrl : null,
                IssueCount = group.Count(),
                TotalStoryPoints = totalPts,
                CompletedStoryPoints = completedPts,
                CompletedIssueCount = completedCount
            });
        }

        return result.OrderByDescending(r => r.TotalStoryPoints).ToList();
    }
}
