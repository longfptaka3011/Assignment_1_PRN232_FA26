using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Sprints.DTOs;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Sprints.Commands.CompleteSprint;

public record CompleteSprintCommand(Guid Id, Guid? TargetSprintId = null) : IRequest<SprintDto>;

public class CompleteSprintCommandHandler : IRequestHandler<CompleteSprintCommand, SprintDto>
{
    private readonly IApplicationDbContext _context;

    public CompleteSprintCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SprintDto> Handle(CompleteSprintCommand request, CancellationToken cancellationToken)
    {
        var sprint = await _context.Sprints
            .Include(s => s.Issues.Where(i => i.DeletedAt == null))
                .ThenInclude(i => i.Status)
            .FirstOrDefaultAsync(s => s.Id == request.Id && s.DeletedAt == null, cancellationToken);

        if (sprint == null)
        {
            throw new NotFoundException("Sprint", request.Id);
        }

        if (sprint.Status != SprintStatus.Active)
        {
            throw new ConflictException("Only active sprints can be completed.");
        }

        sprint.Complete();
        sprint.UpdatedAt = DateTime.UtcNow;

        // Move incomplete issues to target sprint or backlog
        var incompleteIssues = sprint.Issues.Where(i => !i.Status.IsCompletedStatus).ToList();
        if (incompleteIssues.Any())
        {
            if (request.TargetSprintId.HasValue)
            {
                var targetSprint = await _context.Sprints
                    .FirstOrDefaultAsync(s => s.Id == request.TargetSprintId.Value && s.ProjectId == sprint.ProjectId && s.DeletedAt == null, cancellationToken);

                if (targetSprint == null)
                {
                    throw new NotFoundException("Target Sprint", request.TargetSprintId.Value);
                }

                foreach (var issue in incompleteIssues)
                {
                    issue.SprintId = targetSprint.Id;
                    issue.UpdatedAt = DateTime.UtcNow;
                }
            }
            else
            {
                // Move to backlog
                foreach (var issue in incompleteIssues)
                {
                    issue.SprintId = null;
                    issue.UpdatedAt = DateTime.UtcNow;
                }
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        var totalPoints = sprint.Issues.Sum(i => i.StoryPoints ?? 0);
        var completedPoints = sprint.Issues.Where(i => i.Status.IsCompletedStatus).Sum(i => i.StoryPoints ?? 0);

        return new SprintDto
        {
            Id = sprint.Id,
            ProjectId = sprint.ProjectId,
            Name = sprint.Name,
            Goal = sprint.Goal,
            Status = sprint.Status,
            StartDate = sprint.StartDate,
            EndDate = sprint.EndDate,
            CompletedAt = sprint.CompletedAt,
            IssueCount = sprint.Issues.Count,
            TotalStoryPoints = totalPoints,
            CompletedStoryPoints = completedPoints,
            CreatedAt = sprint.CreatedAt
        };
    }
}
