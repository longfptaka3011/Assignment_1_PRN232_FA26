using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Features.Sprints.Commands.CompleteSprint;
using TaskFlow.Application.Features.Sprints.Commands.CreateSprint;
using TaskFlow.Application.Features.Sprints.Commands.DeleteSprint;
using TaskFlow.Application.Features.Sprints.Commands.StartSprint;
using TaskFlow.Application.Features.Sprints.Commands.UpdateSprint;
using TaskFlow.Application.Features.Sprints.DTOs;
using TaskFlow.Application.Features.Sprints.Queries.GetSprintById;
using TaskFlow.Application.Features.Sprints.Queries.GetSprintsByProject;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Api.Controllers;

[Authorize]
public class SprintsController : ApiControllerBase
{
    [HttpGet("/api/v1/projects/{projectId:guid}/sprints")]
    public async Task<ActionResult<List<SprintDto>>> GetSprintsByProject(Guid projectId, [FromQuery] SprintStatus? status = null, CancellationToken cancellationToken = default)
    {
        return Ok(await Mediator.Send(new GetSprintsByProjectQuery(projectId, status), cancellationToken));
    }

    [HttpPost("/api/v1/projects/{projectId:guid}/sprints")]
    [Authorize(Policy = "RequireProjectAdmin")]
    public async Task<ActionResult<SprintDto>> CreateSprint(Guid projectId, [FromBody] CreateSprintRequest request, CancellationToken cancellationToken = default)
    {
        var command = new CreateSprintCommand
        {
            ProjectId = projectId,
            Name = request.Name,
            Goal = request.Goal,
            StartDate = request.StartDate,
            EndDate = request.EndDate
        };

        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetSprintById), new { id = result.Id }, result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SprintDetailDto>> GetSprintById(Guid id, CancellationToken cancellationToken = default)
    {
        return Ok(await Mediator.Send(new GetSprintByIdQuery(id), cancellationToken));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "RequireProjectAdmin")]
    public async Task<ActionResult<SprintDto>> UpdateSprint(Guid id, [FromBody] UpdateSprintRequest request, CancellationToken cancellationToken = default)
    {
        var command = new UpdateSprintCommand
        {
            Id = id,
            Name = request.Name,
            Goal = request.Goal,
            StartDate = request.StartDate,
            EndDate = request.EndDate
        };

        return Ok(await Mediator.Send(command, cancellationToken));
    }

    [HttpPost("{id:guid}/start")]
    [Authorize(Policy = "RequireProjectAdmin")]
    public async Task<ActionResult<SprintDto>> StartSprint(Guid id, [FromBody] StartSprintRequest? request = null, CancellationToken cancellationToken = default)
    {
        var command = new StartSprintCommand
        {
            Id = id,
            StartDate = request?.StartDate,
            EndDate = request?.EndDate
        };

        return Ok(await Mediator.Send(command, cancellationToken));
    }

    [HttpPost("{id:guid}/complete")]
    [Authorize(Policy = "RequireProjectAdmin")]
    public async Task<ActionResult<SprintDto>> CompleteSprint(Guid id, [FromBody] CompleteSprintRequest? request = null, CancellationToken cancellationToken = default)
    {
        var command = new CompleteSprintCommand(id, request?.TargetSprintId);
        return Ok(await Mediator.Send(command, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireProjectAdmin")]
    public async Task<ActionResult> DeleteSprint(Guid id, CancellationToken cancellationToken = default)
    {
        await Mediator.Send(new DeleteSprintCommand(id), cancellationToken);
        return NoContent();
    }
}

public class CreateSprintRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Goal { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class UpdateSprintRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Goal { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class StartSprintRequest
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class CompleteSprintRequest
{
    public Guid? TargetSprintId { get; set; }
}
