using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Issues.Commands.DeleteIssue;

public record DeleteIssueCommand(Guid Id) : IRequest<bool>;

public class DeleteIssueCommandHandler : IRequestHandler<DeleteIssueCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteIssueCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(DeleteIssueCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var issue = await _context.Issues
            .Include(i => i.Project)
                .ThenInclude(p => p.Members)
            .FirstOrDefaultAsync(i => i.Id == request.Id && i.DeletedAt == null, cancellationToken);

        if (issue == null)
        {
            throw new NotFoundException("Issue", request.Id);
        }

        var callerMember = issue.Project.Members.FirstOrDefault(m => m.UserId == currentUserId.Value);
        var isOwnerOrAdmin = callerMember?.Role == ProjectRole.Owner || callerMember?.Role == ProjectRole.Admin || issue.Project.LeadId == currentUserId.Value;
        var isReporter = issue.ReporterId == currentUserId.Value;

        if (!isOwnerOrAdmin && !isReporter)
        {
            throw new ForbiddenAccessException("Only project owners, admins, or the issue reporter can delete this issue.");
        }

        issue.MarkDeleted();

        _context.ActivityLogs.Add(new ActivityLog
        {
            Id = Guid.NewGuid(),
            IssueId = issue.Id,
            UserId = currentUserId.Value,
            ActivityType = ActivityType.Deleted,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
