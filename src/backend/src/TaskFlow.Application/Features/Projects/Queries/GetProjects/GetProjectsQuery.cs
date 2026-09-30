using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Projects.DTOs;

namespace TaskFlow.Application.Features.Projects.Queries.GetProjects;

public record GetProjectsQuery : IRequest<List<ProjectDto>>;

public class GetProjectsQueryHandler : IRequestHandler<GetProjectsQuery, List<ProjectDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetProjectsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<ProjectDto>> Handle(GetProjectsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        // Projects where user is a member or lead
        var projectIds = await _context.ProjectMembers
            .AsNoTracking()
            .Where(pm => pm.UserId == userId.Value)
            .Select(pm => pm.ProjectId)
            .ToListAsync(cancellationToken);

        var projects = await _context.Projects
            .AsNoTracking()
            .Where(p => (projectIds.Contains(p.Id) || p.LeadId == userId.Value) && p.DeletedAt == null)
            .Include(p => p.Lead)
            .Include(p => p.Members)
            .Include(p => p.Issues.Where(i => i.DeletedAt == null))
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProjectDto
            {
                Id = p.Id,
                Name = p.Name,
                Key = p.Key,
                Description = p.Description,
                LeadId = p.LeadId,
                LeadName = p.Lead.FullName,
                LeadAvatarUrl = p.Lead.AvatarUrl,
                IssueCounter = p.IssueCounter,
                IsArchived = p.IsArchived,
                MemberCount = p.Members.Count,
                IssueCount = p.Issues.Count,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return projects;
    }
}
