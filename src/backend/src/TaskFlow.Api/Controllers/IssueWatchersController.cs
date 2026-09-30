using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Features.IssueWatchers.Commands.RemoveWatcher;
using TaskFlow.Application.Features.IssueWatchers.Commands.ToggleWatcher;
using TaskFlow.Application.Features.IssueWatchers.DTOs;
using TaskFlow.Application.Features.IssueWatchers.Queries.GetIssueWatchers;

namespace TaskFlow.Api.Controllers;

[Authorize]
public class IssueWatchersController : ApiControllerBase
{
    [HttpGet("/api/v1/issues/{issueId:guid}/watchers")]
    public async Task<ActionResult<List<WatcherDto>>> GetWatchers(Guid issueId, CancellationToken cancellationToken = default)
    {
        return Ok(await Mediator.Send(new GetIssueWatchersQuery(issueId), cancellationToken));
    }

    [HttpPost("/api/v1/issues/{issueId:guid}/watchers/toggle")]
    public async Task<ActionResult<bool>> ToggleWatcher(Guid issueId, CancellationToken cancellationToken = default)
    {
        var isWatching = await Mediator.Send(new ToggleWatcherCommand(issueId), cancellationToken);
        return Ok(new { isWatching });
    }

    [HttpDelete("/api/v1/issues/{issueId:guid}/watchers/{userId:guid}")]
    public async Task<ActionResult> RemoveWatcher(Guid issueId, Guid userId, CancellationToken cancellationToken = default)
    {
        await Mediator.Send(new RemoveWatcherCommand(issueId, userId), cancellationToken);
        return NoContent();
    }
}
