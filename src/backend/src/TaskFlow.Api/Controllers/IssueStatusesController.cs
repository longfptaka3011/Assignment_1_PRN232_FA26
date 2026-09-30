using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Features.IssueStatuses.Commands;
using TaskFlow.Application.Features.IssueStatuses.DTOs;

namespace TaskFlow.Api.Controllers;

[Authorize]
public class IssueStatusesController : ApiControllerBase
{
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "RequireProjectAdmin")]
    public async Task<ActionResult<IssueStatusDto>> UpdateStatus(Guid id, [FromBody] UpdateIssueStatusCommand command, CancellationToken cancellationToken = default)
    {
        if (id != command.Id)
        {
            return BadRequest("Path ID must match request ID.");
        }

        return Ok(await Mediator.Send(command, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireProjectAdmin")]
    public async Task<ActionResult> DeleteStatus(Guid id, CancellationToken cancellationToken = default)
    {
        await Mediator.Send(new DeleteIssueStatusCommand(id), cancellationToken);
        return NoContent();
    }
}
