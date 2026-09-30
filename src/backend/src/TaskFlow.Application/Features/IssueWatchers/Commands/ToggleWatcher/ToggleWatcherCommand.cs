using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.Features.IssueWatchers.Commands.ToggleWatcher;

public record ToggleWatcherCommand(Guid IssueId) : IRequest<bool>;

public class ToggleWatcherCommandHandler : IRequestHandler<ToggleWatcherCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IProjectAuthorizationService _projectAuthService;

    public ToggleWatcherCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _projectAuthService = projectAuthService;
    }

    public async Task<bool> Handle(ToggleWatcherCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var issue = await _context.Issues
            .FirstOrDefaultAsync(i => i.Id == request.IssueId && i.DeletedAt == null, cancellationToken);

        if (issue == null)
        {
            throw new NotFoundException("Issue", request.IssueId);
        }

        // Anti-IDOR: Check membership
        await _projectAuthService.EnsureMemberAsync(issue.ProjectId, cancellationToken);

        var existingWatcher = await _context.IssueWatchers
            .FirstOrDefaultAsync(w => w.IssueId == request.IssueId && w.UserId == currentUserId.Value, cancellationToken);

        if (existingWatcher != null)
        {
            // Remove watcher (Unwatch)
            _context.IssueWatchers.Remove(existingWatcher);
            await _context.SaveChangesAsync(cancellationToken);
            return false;
        }
        else
        {
            // Add watcher (Watch)
            _context.IssueWatchers.Add(new IssueWatcher
            {
                IssueId = request.IssueId,
                UserId = currentUserId.Value,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
