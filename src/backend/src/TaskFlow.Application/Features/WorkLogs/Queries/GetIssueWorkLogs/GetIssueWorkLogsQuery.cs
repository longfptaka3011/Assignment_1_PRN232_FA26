using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.WorkLogs.DTOs;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.WorkLogs.Queries.GetIssueWorkLogs;

public record GetIssueWorkLogsQuery(Guid IssueId) : IRequest<List<WorkLogDto>>;

public class GetIssueWorkLogsQueryHandler : IRequestHandler<GetIssueWorkLogsQuery, List<WorkLogDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IProjectAuthorizationService _projectAuthService;

    public GetIssueWorkLogsQueryHandler(
        IApplicationDbContext context,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _projectAuthService = projectAuthService;
    }

    public async Task<List<WorkLogDto>> Handle(GetIssueWorkLogsQuery request, CancellationToken cancellationToken)
    {
        var issue = await _context.Issues
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == request.IssueId && i.DeletedAt == null, cancellationToken);

        if (issue == null)
        {
            throw new NotFoundException("Issue", request.IssueId);
        }

        await _projectAuthService.EnsureRoleAsync(
            issue.ProjectId,
            new[] { ProjectRole.Owner, ProjectRole.Admin, ProjectRole.Member, ProjectRole.Viewer },
            cancellationToken);

        return await _context.WorkLogs
            .AsNoTracking()
            .Where(w => w.IssueId == request.IssueId && w.DeletedAt == null)
            .OrderByDescending(w => w.StartedAt)
            .Include(w => w.User)
            .Select(w => new WorkLogDto
            {
                Id = w.Id,
                IssueId = w.IssueId,
                UserId = w.UserId,
                UserName = w.User.FullName,
                UserAvatarUrl = w.User.AvatarUrl,
                TimeSpentMinutes = w.TimeSpentMinutes,
                StartedAt = w.StartedAt,
                Description = w.Description,
                CreatedAt = w.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }
}
