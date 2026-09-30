using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Comments.Commands.DeleteComment;

public record DeleteCommentCommand(Guid Id) : IRequest<bool>;

public class DeleteCommentCommandHandler : IRequestHandler<DeleteCommentCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteCommentCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(DeleteCommentCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var comment = await _context.Comments
            .Include(c => c.Issue)
                .ThenInclude(i => i.Project)
                    .ThenInclude(p => p.Members)
            .FirstOrDefaultAsync(c => c.Id == request.Id && c.DeletedAt == null, cancellationToken);

        if (comment == null)
        {
            throw new NotFoundException("Comment", request.Id);
        }

        var isAuthor = comment.UserId == currentUserId.Value;
        var callerMember = comment.Issue.Project.Members.FirstOrDefault(m => m.UserId == currentUserId.Value);
        var isOwnerOrAdmin = callerMember?.Role == ProjectRole.Owner || callerMember?.Role == ProjectRole.Admin || comment.Issue.Project.LeadId == currentUserId.Value;

        if (!isAuthor && !isOwnerOrAdmin)
        {
            throw new ForbiddenAccessException("You do not have permission to delete this comment.");
        }

        comment.MarkDeleted();

        _context.ActivityLogs.Add(new ActivityLog
        {
            Id = Guid.NewGuid(),
            IssueId = comment.IssueId,
            UserId = currentUserId.Value,
            ActivityType = ActivityType.CommentRemoved,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
