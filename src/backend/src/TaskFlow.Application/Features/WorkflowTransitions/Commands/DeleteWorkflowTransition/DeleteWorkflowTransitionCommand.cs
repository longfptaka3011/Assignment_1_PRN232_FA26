using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.WorkflowTransitions.Commands.DeleteWorkflowTransition;

public record DeleteWorkflowTransitionCommand(Guid Id) : IRequest;

public class DeleteWorkflowTransitionCommandHandler : IRequestHandler<DeleteWorkflowTransitionCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly IProjectAuthorizationService _projectAuthService;

    public DeleteWorkflowTransitionCommandHandler(
        IApplicationDbContext context,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _projectAuthService = projectAuthService;
    }

    public async Task Handle(DeleteWorkflowTransitionCommand request, CancellationToken cancellationToken)
    {
        var transition = await _context.WorkflowTransitions
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

        if (transition == null)
        {
            throw new NotFoundException("WorkflowTransition", request.Id);
        }

        await _projectAuthService.EnsureRoleAsync(
            transition.ProjectId,
            new[] { ProjectRole.Owner, ProjectRole.Admin },
            cancellationToken);

        _context.WorkflowTransitions.Remove(transition);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
