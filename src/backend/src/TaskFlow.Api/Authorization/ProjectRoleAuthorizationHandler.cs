using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Interfaces;

namespace TaskFlow.Api.Authorization;

public class ProjectRoleAuthorizationHandler : AuthorizationHandler<ProjectRoleRequirement>
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IApplicationDbContext _context;

    public ProjectRoleAuthorizationHandler(
        IHttpContextAccessor httpContextAccessor,
        IApplicationDbContext context)
    {
        _httpContextAccessor = httpContextAccessor;
        _context = context;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ProjectRoleRequirement requirement)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null) return;

        var subClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? context.User.FindFirst("sub")?.Value;

        if (!Guid.TryParse(subClaim, out var userId)) return;

        // Try extracting projectId from route
        var routeValues = httpContext.GetRouteData().Values;
        Guid? projectId = null;

        if (routeValues.TryGetValue("projectId", out var projVal) && Guid.TryParse(projVal?.ToString(), out var pId))
        {
            projectId = pId;
        }
        else if (routeValues.TryGetValue("issueKey", out var issueKeyVal) && issueKeyVal != null)
        {
            var issueKey = issueKeyVal.ToString();
            var issue = await _context.Issues
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.IssueKey == issueKey);

            if (issue != null) projectId = issue.ProjectId;
        }
        else if (routeValues.TryGetValue("id", out var idVal) && Guid.TryParse(idVal?.ToString(), out var resourceId))
        {
            // Check if id is an issue
            var issue = await _context.Issues
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == resourceId);

            if (issue != null)
            {
                projectId = issue.ProjectId;
            }
            else
            {
                // Check if id is a sprint
                var sprint = await _context.Sprints
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.Id == resourceId);

                if (sprint != null) projectId = sprint.ProjectId;
            }
        }

        if (!projectId.HasValue) return;

        var member = await _context.ProjectMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(pm => pm.ProjectId == projectId.Value && pm.UserId == userId);

        if (member != null && requirement.AllowedRoles.Contains(member.Role))
        {
            context.Succeed(requirement);
        }
    }
}
