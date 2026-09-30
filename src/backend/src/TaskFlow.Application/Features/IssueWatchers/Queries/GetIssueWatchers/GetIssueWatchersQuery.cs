using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.IssueWatchers.DTOs;

namespace TaskFlow.Application.Features.IssueWatchers.Queries.GetIssueWatchers;

public record GetIssueWatchersQuery(Guid IssueId) : IRequest<List<WatcherDto>>;

public class GetIssueWatchersQueryHandler : IRequestHandler<GetIssueWatchersQuery, List<WatcherDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IProjectAuthorizationService _projectAuthService;

    public GetIssueWatchersQueryHandler(
        IApplicationDbContext context,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _projectAuthService = projectAuthService;
    }

    public async Task<List<WatcherDto>> Handle(GetIssueWatchersQuery request, CancellationToken cancellationToken)
    {
        var issue = await _context.Issues
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == request.IssueId && i.DeletedAt == null, cancellationToken);

        if (issue == null)
        {
            throw new NotFoundException("Issue", request.IssueId);
        }

        // Anti-IDOR: verify membership
        await _projectAuthService.EnsureMemberAsync(issue.ProjectId, cancellationToken);

        return await _context.IssueWatchers
            .AsNoTracking()
            .Where(w => w.IssueId == request.IssueId)
            .OrderBy(w => w.CreatedAt)
            .Select(w => new WatcherDto
            {
                UserId = w.UserId,
                FullName = w.User.FullName,
                Email = w.User.Email,
                AvatarUrl = w.User.AvatarUrl,
                CreatedAt = w.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }
}
