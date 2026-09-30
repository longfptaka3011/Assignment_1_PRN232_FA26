using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.IssueLinks.Commands.DeleteIssueLink;

public record DeleteIssueLinkCommand(Guid LinkId) : IRequest<bool>;

public class DeleteIssueLinkCommandHandler : IRequestHandler<DeleteIssueLinkCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IProjectAuthorizationService _projectAuthService;

    public DeleteIssueLinkCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _projectAuthService = projectAuthService;
    }

    public async Task<bool> Handle(DeleteIssueLinkCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var link = await _context.IssueLinks
            .Include(l => l.SourceIssue)
            .Include(l => l.TargetIssue)
            .FirstOrDefaultAsync(l => l.Id == request.LinkId, cancellationToken);

        if (link == null)
        {
            throw new NotFoundException("IssueLink", request.LinkId);
        }

        // Anti-IDOR: Check caller has permission in the project
        await _projectAuthService.EnsureRoleAsync(
            link.SourceIssue.ProjectId,
            new[] { ProjectRole.Owner, ProjectRole.Admin, ProjectRole.Member },
            cancellationToken);

        _context.IssueLinks.Remove(link);

        _context.ActivityLogs.Add(new ActivityLog
        {
            Id = Guid.NewGuid(),
            IssueId = link.SourceIssueId,
            UserId = currentUserId.Value,
            ActivityType = ActivityType.Updated,
            FieldName = "Link",
            OldValue = $"{link.LinkType} {link.TargetIssue.IssueKey}",
            NewValue = "Removed link",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
