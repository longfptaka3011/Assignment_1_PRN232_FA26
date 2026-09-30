using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Comments.DTOs;

namespace TaskFlow.Application.Features.Comments.Queries.GetCommentsByIssue;

public record GetCommentsByIssueQuery(Guid IssueId) : IRequest<List<CommentDto>>;

public class GetCommentsByIssueQueryHandler : IRequestHandler<GetCommentsByIssueQuery, List<CommentDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCommentsByIssueQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CommentDto>> Handle(GetCommentsByIssueQuery request, CancellationToken cancellationToken)
    {
        return await _context.Comments
            .AsNoTracking()
            .Where(c => c.IssueId == request.IssueId && c.DeletedAt == null)
            .Include(c => c.User)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentDto
            {
                Id = c.Id,
                IssueId = c.IssueId,
                UserId = c.UserId,
                UserName = c.User.FullName,
                UserAvatarUrl = c.User.AvatarUrl,
                Content = c.Content,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }
}
