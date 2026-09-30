using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.WorkLogs.Commands.DeleteWorkLog;

public record DeleteWorkLogCommand(Guid IssueId, Guid WorkLogId) : IRequest;

public class DeleteWorkLogCommandHandler : IRequestHandler<DeleteWorkLogCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IProjectAuthorizationService _projectAuthService;

    public DeleteWorkLogCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _projectAuthService = projectAuthService;
    }

    public async Task Handle(DeleteWorkLogCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var workLog = await _context.WorkLogs
            .Include(w => w.Issue)
            .FirstOrDefaultAsync(w => w.Id == request.WorkLogId && w.IssueId == request.IssueId && w.DeletedAt == null, cancellationToken);

        if (workLog == null)
        {
            throw new NotFoundException("WorkLog", request.WorkLogId);
        }

        // Only author or project Admin/Owner can delete
        var isAuthor = workLog.UserId == currentUserId.Value;
        if (!isAuthor)
        {
            await _projectAuthService.EnsureRoleAsync(
                workLog.Issue.ProjectId,
                new[] { ProjectRole.Owner, ProjectRole.Admin },
                cancellationToken);
        }

        workLog.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }
}
