using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Projects.DTOs;

namespace TaskFlow.Application.Features.Projects.Queries.GetProjectMembers;

public record GetProjectMembersQuery(Guid ProjectId) : IRequest<List<ProjectMemberDto>>;

public class GetProjectMembersQueryHandler : IRequestHandler<GetProjectMembersQuery, List<ProjectMemberDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetProjectMembersQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<ProjectMemberDto>> Handle(GetProjectMembersQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var project = await _context.Projects
            .Include(p => p.Members)
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId && p.DeletedAt == null, cancellationToken);

        if (project == null)
        {
            throw new NotFoundException("Project", request.ProjectId);
        }

        var isMember = project.LeadId == currentUserId.Value || project.Members.Any(m => m.UserId == currentUserId.Value);
        if (!isMember)
        {
            throw new ForbiddenAccessException("You are not a member of this project.");
        }

        var members = await _context.ProjectMembers
            .AsNoTracking()
            .Where(pm => pm.ProjectId == request.ProjectId)
            .Include(pm => pm.User)
            .OrderBy(pm => pm.JoinedAt)
            .Select(pm => new ProjectMemberDto
            {
                Id = pm.Id,
                ProjectId = pm.ProjectId,
                UserId = pm.UserId,
                Email = pm.User.Email,
                FullName = pm.User.FullName,
                AvatarUrl = pm.User.AvatarUrl,
                Role = pm.Role,
                JoinedAt = pm.JoinedAt
            })
            .ToListAsync(cancellationToken);

        return members;
    }
}
