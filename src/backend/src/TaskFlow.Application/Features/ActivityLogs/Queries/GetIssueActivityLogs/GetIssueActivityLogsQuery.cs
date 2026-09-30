using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.ActivityLogs.DTOs;

namespace TaskFlow.Application.Features.ActivityLogs.Queries.GetIssueActivityLogs;

public record GetIssueActivityLogsQuery(Guid IssueId) : IRequest<List<ActivityLogDto>>;

public class GetIssueActivityLogsQueryHandler : IRequestHandler<GetIssueActivityLogsQuery, List<ActivityLogDto>>
{
    private readonly IApplicationDbContext _context;

    public GetIssueActivityLogsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ActivityLogDto>> Handle(GetIssueActivityLogsQuery request, CancellationToken cancellationToken)
    {
        return await _context.ActivityLogs
            .AsNoTracking()
            .Where(al => al.IssueId == request.IssueId)
            .Include(al => al.User)
            .OrderByDescending(al => al.CreatedAt)
            .Select(al => new ActivityLogDto
            {
                Id = al.Id,
                IssueId = al.IssueId,
                UserId = al.UserId,
                UserName = al.User.FullName,
                UserAvatarUrl = al.User.AvatarUrl,
                ActivityType = al.ActivityType,
                FieldName = al.FieldName,
                OldValue = al.OldValue,
                NewValue = al.NewValue,
                CreatedAt = al.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }
}
