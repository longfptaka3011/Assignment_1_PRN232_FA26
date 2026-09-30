using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Features.WorkflowTransitions.Commands.CreateWorkflowTransition;
using TaskFlow.Application.Features.WorkflowTransitions.Commands.DeleteWorkflowTransition;
using TaskFlow.Application.Features.WorkflowTransitions.DTOs;
using TaskFlow.Application.Features.WorkflowTransitions.Queries.GetWorkflowTransitions;

namespace TaskFlow.Api.Controllers;

[Authorize]
public class WorkflowTransitionsController : ApiControllerBase
{
    [HttpGet("/api/v1/projects/{projectId:guid}/workflow-transitions")]
    public async Task<ActionResult<List<WorkflowTransitionDto>>> GetWorkflowTransitions(Guid projectId, CancellationToken cancellationToken)
    {
        return Ok(await Mediator.Send(new GetWorkflowTransitionsQuery(projectId), cancellationToken));
    }

    [HttpPost("/api/v1/projects/{projectId:guid}/workflow-transitions")]
    [Authorize(Policy = "RequireProjectAdmin")]
    public async Task<ActionResult<WorkflowTransitionDto>> CreateWorkflowTransition(
        Guid projectId,
        [FromBody] CreateWorkflowTransitionRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateWorkflowTransitionCommand
        {
            ProjectId = projectId,
            FromStatusId = request.FromStatusId,
            ToStatusId = request.ToStatusId,
            Name = request.Name
        };

        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetWorkflowTransitions), new { projectId }, result);
    }

    [HttpDelete("workflow-transitions/{id:guid}")]
    [Authorize(Policy = "RequireProjectAdmin")]
    public async Task<ActionResult> DeleteWorkflowTransition(Guid id, CancellationToken cancellationToken)
    {
        await Mediator.Send(new DeleteWorkflowTransitionCommand(id), cancellationToken);
        return NoContent();
    }
}

public class CreateWorkflowTransitionRequest
{
    public Guid FromStatusId { get; set; }
    public Guid ToStatusId { get; set; }
    public string? Name { get; set; }
}
