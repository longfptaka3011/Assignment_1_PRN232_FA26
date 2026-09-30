using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Sprints.DTOs;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Sprints.Commands.CreateSprint;

public record CreateSprintCommand : IRequest<SprintDto>
{
    public Guid ProjectId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Goal { get; init; }
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
}

public class CreateSprintCommandValidator : AbstractValidator<CreateSprintCommand>
{
    public CreateSprintCommandValidator()
    {
        RuleFor(v => v.ProjectId).NotEmpty();
        RuleFor(v => v.Name)
            .NotEmpty().WithMessage("Sprint name is required.")
            .MaximumLength(100).WithMessage("Sprint name must not exceed 100 characters.");

        RuleFor(v => v.Goal)
            .MaximumLength(1000).WithMessage("Goal must not exceed 1000 characters.");

        When(v => v.StartDate.HasValue && v.EndDate.HasValue, () =>
        {
            RuleFor(v => v.EndDate)
                .GreaterThan(v => v.StartDate)
                .WithMessage("End date must be after start date.");
        });
    }
}

public class CreateSprintCommandHandler : IRequestHandler<CreateSprintCommand, SprintDto>
{
    private readonly IApplicationDbContext _context;

    public CreateSprintCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SprintDto> Handle(CreateSprintCommand request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId && p.DeletedAt == null, cancellationToken);

        if (project == null)
        {
            throw new NotFoundException("Project", request.ProjectId);
        }

        var sprint = new Sprint
        {
            Id = Guid.NewGuid(),
            ProjectId = request.ProjectId,
            Name = request.Name.Trim(),
            Goal = request.Goal?.Trim(),
            Status = SprintStatus.Planned,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Sprints.Add(sprint);
        await _context.SaveChangesAsync(cancellationToken);

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
            IssueCount = 0,
            TotalStoryPoints = 0,
            CompletedStoryPoints = 0,
            CreatedAt = sprint.CreatedAt
        };
    }
}
