using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.IssueWatchers.Commands.RemoveWatcher;

public record RemoveWatcherCommand(Guid IssueId, Guid UserId) : IRequest<bool>;

public class RemoveWatcherCommandHandler : IRequestHandler<RemoveWatcherCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IProjectAuthorizationService _projectAuthService;

    public RemoveWatcherCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _projectAuthService = projectAuthService;
    }

    public async Task<bool> Handle(RemoveWatcherCommand request, CancellationToken cancellationToken)
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

        var isSelf = currentUserId.Value == request.UserId;
        if (!isSelf)
        {
            await _projectAuthService.EnsureRoleAsync(
                issue.ProjectId,
                new[] { ProjectRole.Owner, ProjectRole.Admin },
                cancellationToken);
        }

        var watcher = await _context.IssueWatchers
            .FirstOrDefaultAsync(w => w.IssueId == request.IssueId && w.UserId == request.UserId, cancellationToken);

        if (watcher != null)
        {
            _context.IssueWatchers.Remove(watcher);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return true;
    }
}
