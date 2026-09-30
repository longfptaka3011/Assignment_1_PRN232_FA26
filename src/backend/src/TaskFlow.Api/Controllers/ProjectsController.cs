using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Features.IssueStatuses.Commands;
using TaskFlow.Application.Features.IssueStatuses.DTOs;
using TaskFlow.Application.Features.IssueStatuses.Queries;
using TaskFlow.Application.Features.IssueTypes.DTOs;
using TaskFlow.Application.Features.IssueTypes.Queries;
using TaskFlow.Application.Features.Labels.Commands;
using TaskFlow.Application.Features.Labels.DTOs;
using TaskFlow.Application.Features.Labels.Queries;
using TaskFlow.Application.Features.Projects.Commands.AddProjectMember;
using TaskFlow.Application.Features.Projects.Commands.ArchiveProject;
using TaskFlow.Application.Features.Projects.Commands.CreateProject;
using TaskFlow.Application.Features.Projects.Commands.DeleteProject;
using TaskFlow.Application.Features.Projects.Commands.RemoveProjectMember;
using TaskFlow.Application.Features.Projects.Commands.UpdateProject;
using TaskFlow.Application.Features.Projects.Commands.UpdateProjectMemberRole;
using TaskFlow.Application.Features.Projects.DTOs;
using TaskFlow.Application.Features.Projects.Queries.GetProjectById;
using TaskFlow.Application.Features.Projects.Queries.GetProjectByKey;
using TaskFlow.Application.Features.Projects.Queries.GetProjectMembers;
using TaskFlow.Application.Features.Projects.Queries.GetProjects;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Api.Controllers;

[Authorize]
public class ProjectsController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ProjectDto>>> GetProjects(CancellationToken cancellationToken)
    {
        return Ok(await Mediator.Send(new GetProjectsQuery(), cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<ProjectDetailDto>> CreateProject([FromBody] CreateProjectCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetProjectById), new { id = result.Id }, result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectDetailDto>> GetProjectById(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await Mediator.Send(new GetProjectByIdQuery(id), cancellationToken));
    }

    [HttpGet("by-key/{key}")]
    public async Task<ActionResult<ProjectDetailDto>> GetProjectByKey(string key, CancellationToken cancellationToken)
    {
        return Ok(await Mediator.Send(new GetProjectByKeyQuery(key), cancellationToken));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "RequireProjectAdmin")]
    public async Task<ActionResult<ProjectDto>> UpdateProject(Guid id, [FromBody] UpdateProjectCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest("Path ID must match request ID.");
        }

        return Ok(await Mediator.Send(command, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireProjectOwner")]
    public async Task<ActionResult> DeleteProject(Guid id, CancellationToken cancellationToken)
    {
        await Mediator.Send(new DeleteProjectCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/archive")]
    [Authorize(Policy = "RequireProjectOwner")]
    public async Task<ActionResult> ArchiveProject(Guid id, [FromQuery] bool isArchived = true, CancellationToken cancellationToken = default)
    {
        await Mediator.Send(new ArchiveProjectCommand(id, isArchived), cancellationToken);
        return NoContent();
    }

    // --- Project Members ---

    [HttpGet("{projectId:guid}/members")]
    public async Task<ActionResult<List<ProjectMemberDto>>> GetProjectMembers(Guid projectId, CancellationToken cancellationToken)
    {
        return Ok(await Mediator.Send(new GetProjectMembersQuery(projectId), cancellationToken));
    }

    [HttpPost("{projectId:guid}/members")]
    [Authorize(Policy = "RequireProjectAdmin")]
    public async Task<ActionResult<ProjectMemberDto>> AddProjectMember(Guid projectId, [FromBody] AddProjectMemberCommand command, CancellationToken cancellationToken)
    {
        if (projectId != command.ProjectId)
        {
            return BadRequest("Path ProjectId must match request ProjectId.");
        }

        return Ok(await Mediator.Send(command, cancellationToken));
    }

    [HttpPut("{projectId:guid}/members/{userId:guid}")]
    [Authorize(Policy = "RequireProjectAdmin")]
    public async Task<ActionResult<ProjectMemberDto>> UpdateMemberRole(Guid projectId, Guid userId, [FromBody] UpdateProjectMemberRoleRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateProjectMemberRoleCommand
        {
            ProjectId = projectId,
            UserId = userId,
            Role = request.Role
        };

        return Ok(await Mediator.Send(command, cancellationToken));
    }

    [HttpDelete("{projectId:guid}/members/{userId:guid}")]
    public async Task<ActionResult> RemoveMember(Guid projectId, Guid userId, CancellationToken cancellationToken)
    {
        await Mediator.Send(new RemoveProjectMemberCommand(projectId, userId), cancellationToken);
        return NoContent();
    }

    // --- Issue Statuses ---

    [HttpGet("{projectId:guid}/statuses")]
    public async Task<ActionResult<List<IssueStatusDto>>> GetProjectStatuses(Guid projectId, CancellationToken cancellationToken)
    {
        return Ok(await Mediator.Send(new GetIssueStatusesQuery(projectId), cancellationToken));
    }

    [HttpPost("{projectId:guid}/statuses")]
    [Authorize(Policy = "RequireProjectAdmin")]
    public async Task<ActionResult<IssueStatusDto>> CreateStatus(Guid projectId, [FromBody] CreateIssueStatusCommand command, CancellationToken cancellationToken)
    {
        if (projectId != command.ProjectId)
        {
            return BadRequest("Path ProjectId must match request ProjectId.");
        }

        return Ok(await Mediator.Send(command, cancellationToken));
    }

    // --- Issue Types ---

    [HttpGet("{projectId:guid}/types")]
    public async Task<ActionResult<List<IssueTypeDto>>> GetProjectIssueTypes(Guid projectId, CancellationToken cancellationToken)
    {
        return Ok(await Mediator.Send(new GetIssueTypesQuery(projectId), cancellationToken));
    }

    // --- Labels ---

    [HttpGet("{projectId:guid}/labels")]
    public async Task<ActionResult<List<LabelDto>>> GetProjectLabels(Guid projectId, CancellationToken cancellationToken)
    {
        return Ok(await Mediator.Send(new GetProjectLabelsQuery(projectId), cancellationToken));
    }

    [HttpPost("{projectId:guid}/labels")]
    [Authorize(Policy = "RequireProjectMember")]
    public async Task<ActionResult<LabelDto>> CreateLabel(Guid projectId, [FromBody] CreateLabelCommand command, CancellationToken cancellationToken)
    {
        if (projectId != command.ProjectId)
        {
            return BadRequest("Path ProjectId must match request ProjectId.");
        }

        return Ok(await Mediator.Send(command, cancellationToken));
    }
}

public class UpdateProjectMemberRoleRequest
{
    public ProjectRole Role { get; set; }
}
