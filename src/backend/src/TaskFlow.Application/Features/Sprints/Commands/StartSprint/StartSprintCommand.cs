using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Sprints.DTOs;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Sprints.Commands.StartSprint;

public record StartSprintCommand : IRequest<SprintDto>
{
    public Guid Id { get; init; }
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
}

public class StartSprintCommandValidator : AbstractValidator<StartSprintCommand>
{
    public StartSprintCommandValidator()
    {
        RuleFor(v => v.Id).NotEmpty();
        When(v => v.StartDate.HasValue && v.EndDate.HasValue, () =>
        {
            RuleFor(v => v.EndDate)
                .GreaterThan(v => v.StartDate)
                .WithMessage("End date must be after start date.");
        });
    }
}

public class StartSprintCommandHandler : IRequestHandler<StartSprintCommand, SprintDto>
{
    private readonly IApplicationDbContext _context;

    public StartSprintCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SprintDto> Handle(StartSprintCommand request, CancellationToken cancellationToken)
    {
        var sprint = await _context.Sprints
            .Include(s => s.Issues.Where(i => i.DeletedAt == null))
                .ThenInclude(i => i.Status)
            .FirstOrDefaultAsync(s => s.Id == request.Id && s.DeletedAt == null, cancellationToken);

        if (sprint == null)
        {
            throw new NotFoundException("Sprint", request.Id);
        }

        if (sprint.Status != SprintStatus.Planned)
        {
            throw new ConflictException("Only planned sprints can be started.");
        }

        // Check if there is already an active sprint in this project
        var hasActiveSprint = await _context.Sprints
            .AnyAsync(s => s.ProjectId == sprint.ProjectId && s.Status == SprintStatus.Active && s.DeletedAt == null, cancellationToken);

        if (hasActiveSprint)
        {
            throw new ConflictException("Another sprint is currently active in this project. Complete it before starting a new sprint.");
        }

        var start = request.StartDate ?? DateTime.UtcNow;
        var end = request.EndDate ?? start.AddDays(14); // Default 2 weeks

        sprint.Start(start, end);
        sprint.UpdatedAt = DateTime.UtcNow;

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
