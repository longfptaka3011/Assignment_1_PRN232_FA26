using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Common.Interfaces;

public interface IProjectAuthorizationService
{
    Task<bool> IsMemberAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<bool> HasRoleAsync(Guid projectId, ProjectRole[] allowedRoles, CancellationToken cancellationToken = default);
    Task EnsureMemberAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task EnsureRoleAsync(Guid projectId, ProjectRole[] allowedRoles, CancellationToken cancellationToken = default);
}
