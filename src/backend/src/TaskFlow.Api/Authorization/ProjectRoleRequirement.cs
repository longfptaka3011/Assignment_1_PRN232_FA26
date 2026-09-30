using Microsoft.AspNetCore.Authorization;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Api.Authorization;

public class ProjectRoleRequirement : IAuthorizationRequirement
{
    public ProjectRole[] AllowedRoles { get; }

    public ProjectRoleRequirement(params ProjectRole[] allowedRoles)
    {
        AllowedRoles = allowedRoles;
    }
}
