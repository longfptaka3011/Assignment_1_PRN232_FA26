using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public class ProjectAuthorizationService : IProjectAuthorizationService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ProjectAuthorizationService(ApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> IsMemberAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return false;

        return await _context.ProjectMembers
            .AsNoTracking()
            .AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId.Value, cancellationToken);
    }

    public async Task<bool> HasRoleAsync(Guid projectId, ProjectRole[] allowedRoles, CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return false;

        var member = await _context.ProjectMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId.Value, cancellationToken);

        if (member == null) return false;

        return allowedRoles.Contains(member.Role);
    }

    public async Task EnsureMemberAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var isMember = await IsMemberAsync(projectId, cancellationToken);
        if (!isMember)
        {
            throw new ForbiddenAccessException("You do not have access to this project.");
        }
    }

    public async Task EnsureRoleAsync(Guid projectId, ProjectRole[] allowedRoles, CancellationToken cancellationToken = default)
    {
        var hasRole = await HasRoleAsync(projectId, allowedRoles, cancellationToken);
        if (!hasRole)
        {
            throw new ForbiddenAccessException("You do not have the required role in this project to perform this action.");
        }
    }
}
