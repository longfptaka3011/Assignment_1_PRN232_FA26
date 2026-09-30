using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Comments.DTOs;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Comments.Commands.UpdateComment;

public record UpdateCommentCommand : IRequest<CommentDto>
{
    public Guid Id { get; init; }
    public string Content { get; init; } = string.Empty;
}

public class UpdateCommentCommandValidator : AbstractValidator<UpdateCommentCommand>
{
    public UpdateCommentCommandValidator()
    {
        RuleFor(v => v.Id).NotEmpty();
        RuleFor(v => v.Content)
            .NotEmpty().WithMessage("Comment content cannot be empty.")
            .MaximumLength(10000).WithMessage("Comment must not exceed 10000 characters.");
    }
}

public class UpdateCommentCommandHandler : IRequestHandler<UpdateCommentCommand, CommentDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateCommentCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<CommentDto> Handle(UpdateCommentCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var comment = await _context.Comments
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == request.Id && c.DeletedAt == null, cancellationToken);

        if (comment == null)
        {
            throw new NotFoundException("Comment", request.Id);
        }

        if (comment.UserId != currentUserId.Value)
        {
            throw new ForbiddenAccessException("You can only edit your own comments.");
        }

        comment.Content = request.Content.Trim();
        comment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new CommentDto
        {
            Id = comment.Id,
            IssueId = comment.IssueId,
            UserId = comment.UserId,
            UserName = comment.User.FullName,
            UserAvatarUrl = comment.User.AvatarUrl,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt
        };
    }
}
