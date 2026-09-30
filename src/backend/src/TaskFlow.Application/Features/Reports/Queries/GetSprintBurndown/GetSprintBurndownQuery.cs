using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Reports.DTOs;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Reports.Queries.GetSprintBurndown;

public record GetSprintBurndownQuery(Guid SprintId) : IRequest<SprintBurndownDto>;

public class GetSprintBurndownQueryHandler : IRequestHandler<GetSprintBurndownQuery, SprintBurndownDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IProjectAuthorizationService _projectAuthService;

    public GetSprintBurndownQueryHandler(
        IApplicationDbContext context,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _projectAuthService = projectAuthService;
    }

    public async Task<SprintBurndownDto> Handle(GetSprintBurndownQuery request, CancellationToken cancellationToken)
    {
        var sprint = await _context.Sprints
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.SprintId && s.DeletedAt == null, cancellationToken);

        if (sprint == null)
        {
            throw new NotFoundException("Sprint", request.SprintId);
        }

        await _projectAuthService.EnsureRoleAsync(
            sprint.ProjectId,
            new[] { ProjectRole.Owner, ProjectRole.Admin, ProjectRole.Member, ProjectRole.Viewer },
            cancellationToken);

        var issues = await _context.Issues
            .AsNoTracking()
            .Include(i => i.Status)
            .Where(i => i.SprintId == request.SprintId && i.DeletedAt == null)
            .ToListAsync(cancellationToken);

        var totalPoints = issues.Sum(i => i.StoryPoints ?? 0m);
        var totalIssues = issues.Count;

        var startDate = sprint.StartDate ?? sprint.CreatedAt;
        var endDate = sprint.EndDate ?? startDate.AddDays(14);
        var totalDays = Math.Max(1, (int)(endDate.Date - startDate.Date).TotalDays);

        var completedPoints = issues.Where(i => i.Status.IsCompletedStatus).Sum(i => i.StoryPoints ?? 0m);
        var completedCount = issues.Count(i => i.Status.IsCompletedStatus);

        var dataPoints = new List<BurndownDataPointDto>();
        for (int i = 0; i <= totalDays; i++)
        {
            var dayDate = startDate.AddDays(i);
            var idealFraction = 1.0m - ((decimal)i / totalDays);
            var idealPoints = Math.Max(0m, Math.Round(totalPoints * idealFraction, 1));

            // For days up to now, show progression; for future days, project remaining points
            decimal remainingPoints;
            int remainingIssues;
            if (dayDate.Date > DateTime.UtcNow.Date)
            {
                remainingPoints = Math.Max(0m, totalPoints - completedPoints);
                remainingIssues = Math.Max(0, totalIssues - completedCount);
            }
            else
            {
                var progressFraction = totalDays > 0 ? (decimal)i / totalDays : 1m;
                var estimatedBurned = completedPoints * progressFraction;
                remainingPoints = Math.Max(0m, totalPoints - estimatedBurned);
                remainingIssues = Math.Max(0, totalIssues - (int)(completedCount * progressFraction));
            }

            dataPoints.Add(new BurndownDataPointDto
            {
                Date = dayDate.ToString("yyyy-MM-dd"),
                IdealStoryPoints = idealPoints,
                RemainingStoryPoints = Math.Round(remainingPoints, 1),
                RemainingIssues = remainingIssues
            });
        }

        return new SprintBurndownDto
        {
            SprintId = sprint.Id,
            SprintName = sprint.Name,
            TotalStoryPoints = totalPoints,
            TotalIssues = totalIssues,
            DataPoints = dataPoints
        };
    }
}
