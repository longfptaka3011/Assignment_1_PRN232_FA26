using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Sprints.DTOs;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Sprints.Commands.UpdateSprint;

public record UpdateSprintCommand : IRequest<SprintDto>
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Goal { get; init; }
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
}

public class UpdateSprintCommandValidator : AbstractValidator<UpdateSprintCommand>
{
    public UpdateSprintCommandValidator()
    {
        RuleFor(v => v.Id).NotEmpty();
        RuleFor(v => v.Name).NotEmpty().MaximumLength(100);
        RuleFor(v => v.Goal).MaximumLength(1000);

        When(v => v.StartDate.HasValue && v.EndDate.HasValue, () =>
        {
            RuleFor(v => v.EndDate)
                .GreaterThan(v => v.StartDate)
                .WithMessage("End date must be after start date.");
        });
    }
}

public class UpdateSprintCommandHandler : IRequestHandler<UpdateSprintCommand, SprintDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateSprintCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SprintDto> Handle(UpdateSprintCommand request, CancellationToken cancellationToken)
    {
        var sprint = await _context.Sprints
            .Include(s => s.Issues.Where(i => i.DeletedAt == null))
                .ThenInclude(i => i.Status)
            .FirstOrDefaultAsync(s => s.Id == request.Id && s.DeletedAt == null, cancellationToken);

        if (sprint == null)
        {
            throw new NotFoundException("Sprint", request.Id);
        }

        sprint.Name = request.Name.Trim();
        sprint.Goal = request.Goal?.Trim();
        sprint.StartDate = request.StartDate;
        sprint.EndDate = request.EndDate;
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
