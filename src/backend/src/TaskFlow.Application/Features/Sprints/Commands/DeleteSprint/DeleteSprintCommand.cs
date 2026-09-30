using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;

namespace TaskFlow.Application.Features.Sprints.Commands.DeleteSprint;

public record DeleteSprintCommand(Guid Id) : IRequest<bool>;

public class DeleteSprintCommandHandler : IRequestHandler<DeleteSprintCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteSprintCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteSprintCommand request, CancellationToken cancellationToken)
    {
        var sprint = await _context.Sprints
            .Include(s => s.Issues.Where(i => i.DeletedAt == null))
            .FirstOrDefaultAsync(s => s.Id == request.Id && s.DeletedAt == null, cancellationToken);

        if (sprint == null)
        {
            throw new NotFoundException("Sprint", request.Id);
        }

        // Unlink issues from this sprint (move to backlog)
        foreach (var issue in sprint.Issues)
        {
            issue.SprintId = null;
            issue.UpdatedAt = DateTime.UtcNow;
        }

        sprint.MarkDeleted();
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
