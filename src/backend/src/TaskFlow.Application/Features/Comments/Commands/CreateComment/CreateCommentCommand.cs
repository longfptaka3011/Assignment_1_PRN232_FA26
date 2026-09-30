using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Comments.DTOs;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Comments.Commands.CreateComment;

public record CreateCommentCommand : IRequest<CommentDto>
{
    public Guid IssueId { get; init; }
    public string Content { get; init; } = string.Empty;
}

public class CreateCommentCommandValidator : AbstractValidator<CreateCommentCommand>
{
    public CreateCommentCommandValidator()
    {
        RuleFor(v => v.IssueId).NotEmpty();
        RuleFor(v => v.Content)
            .NotEmpty().WithMessage("Comment content cannot be empty.")
            .MaximumLength(10000).WithMessage("Comment must not exceed 10000 characters.");
    }
}

public class CreateCommentCommandHandler : IRequestHandler<CreateCommentCommand, CommentDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateCommentCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<CommentDto> Handle(CreateCommentCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var issue = await _context.Issues
            .Include(i => i.Project)
            .FirstOrDefaultAsync(i => i.Id == request.IssueId && i.DeletedAt == null, cancellationToken);

        if (issue == null)
        {
            throw new NotFoundException("Issue", request.IssueId);
        }

        var user = await _context.Profiles
            .FirstOrDefaultAsync(p => p.Id == currentUserId.Value, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("Profile", currentUserId.Value);
        }

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            IssueId = issue.Id,
            UserId = user.Id,
            Content = request.Content.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Comments.Add(comment);

        // Activity log
        _context.ActivityLogs.Add(new ActivityLog
        {
            Id = Guid.NewGuid(),
            IssueId = issue.Id,
            UserId = user.Id,
            ActivityType = ActivityType.CommentAdded,
            NewValue = comment.Content.Length > 100 ? comment.Content.Substring(0, 100) + "..." : comment.Content,
            CreatedAt = DateTime.UtcNow
        });

        // Notify Assignee and Reporter if not author
        var notifyUsers = new HashSet<Guid>();
        if (issue.AssigneeId.HasValue && issue.AssigneeId.Value != user.Id)
        {
            notifyUsers.Add(issue.AssigneeId.Value);
        }
        if (issue.ReporterId != user.Id)
        {
            notifyUsers.Add(issue.ReporterId);
        }

        foreach (var recipientId in notifyUsers)
        {
            _context.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                RecipientId = recipientId,
                SenderId = user.Id,
                Type = NotificationType.CommentAdded,
                Title = "New Comment",
                Message = $"{user.FullName} commented on {issue.IssueKey}: {issue.Title}",
                LinkUrl = $"/issues/{issue.IssueKey}",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new CommentDto
        {
            Id = comment.Id,
            IssueId = comment.IssueId,
            UserId = user.Id,
            UserName = user.FullName,
            UserAvatarUrl = user.AvatarUrl,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt
        };
    }
}
