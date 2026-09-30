using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.WorkflowTransitions.DTOs;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.WorkflowTransitions.Commands.CreateWorkflowTransition;

public record CreateWorkflowTransitionCommand : IRequest<WorkflowTransitionDto>
{
    public Guid ProjectId { get; init; }
    public Guid FromStatusId { get; init; }
    public Guid ToStatusId { get; init; }
    public string? Name { get; init; }
}

public class CreateWorkflowTransitionCommandValidator : AbstractValidator<CreateWorkflowTransitionCommand>
{
    public CreateWorkflowTransitionCommandValidator()
    {
        RuleFor(v => v.ProjectId).NotEmpty();
        RuleFor(v => v.FromStatusId).NotEmpty();
        RuleFor(v => v.ToStatusId).NotEmpty();
        RuleFor(v => v.ToStatusId).NotEqual(v => v.FromStatusId)
            .WithMessage("Transition must be between two different statuses.");
    }
}

public class CreateWorkflowTransitionCommandHandler : IRequestHandler<CreateWorkflowTransitionCommand, WorkflowTransitionDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IProjectAuthorizationService _projectAuthService;

    public CreateWorkflowTransitionCommandHandler(
        IApplicationDbContext context,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _projectAuthService = projectAuthService;
    }

    public async Task<WorkflowTransitionDto> Handle(CreateWorkflowTransitionCommand request, CancellationToken cancellationToken)
    {
        await _projectAuthService.EnsureRoleAsync(
            request.ProjectId,
            new[] { ProjectRole.Owner, ProjectRole.Admin },
            cancellationToken);

        var fromStatus = await _context.IssueStatuses
            .FirstOrDefaultAsync(s => s.Id == request.FromStatusId && s.ProjectId == request.ProjectId, cancellationToken);
        if (fromStatus == null)
        {
            throw new NotFoundException("FromStatus", request.FromStatusId);
        }

        var toStatus = await _context.IssueStatuses
            .FirstOrDefaultAsync(s => s.Id == request.ToStatusId && s.ProjectId == request.ProjectId, cancellationToken);
        if (toStatus == null)
        {
            throw new NotFoundException("ToStatus", request.ToStatusId);
        }

        var exists = await _context.WorkflowTransitions
            .AnyAsync(t => t.ProjectId == request.ProjectId && t.FromStatusId == request.FromStatusId && t.ToStatusId == request.ToStatusId, cancellationToken);
        if (exists)
        {
            throw new ConflictException("A transition between these two statuses already exists.");
        }

        var transition = new WorkflowTransition
        {
            Id = Guid.NewGuid(),
            ProjectId = request.ProjectId,
            FromStatusId = request.FromStatusId,
            ToStatusId = request.ToStatusId,
            Name = request.Name ?? $"Move to {toStatus.Name}"
        };

        _context.WorkflowTransitions.Add(transition);
        await _context.SaveChangesAsync(cancellationToken);

        return new WorkflowTransitionDto
        {
            Id = transition.Id,
            ProjectId = transition.ProjectId,
            FromStatusId = transition.FromStatusId,
            FromStatusName = fromStatus.Name,
            FromStatusColorHex = fromStatus.ColorHex,
            ToStatusId = transition.ToStatusId,
            ToStatusName = toStatus.Name,
            ToStatusColorHex = toStatus.ColorHex,
            Name = transition.Name
        };
    }
}
