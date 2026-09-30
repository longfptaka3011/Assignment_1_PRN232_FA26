using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Features.WorkLogs.Commands.CreateWorkLog;
using TaskFlow.Application.Features.WorkLogs.Commands.DeleteWorkLog;
using TaskFlow.Application.Features.WorkLogs.DTOs;
using TaskFlow.Application.Features.WorkLogs.Queries.GetIssueWorkLogs;

namespace TaskFlow.Api.Controllers;

[Authorize]
public class WorkLogsController : ApiControllerBase
{
    [HttpGet("/api/v1/issues/{issueId:guid}/work-logs")]
    public async Task<ActionResult<List<WorkLogDto>>> GetIssueWorkLogs(Guid issueId, CancellationToken cancellationToken)
    {
        return Ok(await Mediator.Send(new GetIssueWorkLogsQuery(issueId), cancellationToken));
    }

    [HttpPost("/api/v1/issues/{issueId:guid}/work-logs")]
    public async Task<ActionResult<WorkLogDto>> CreateWorkLog(
        Guid issueId,
        [FromBody] CreateWorkLogRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateWorkLogCommand
        {
            IssueId = issueId,
            TimeSpentMinutes = request.TimeSpentMinutes,
            StartedAt = request.StartedAt ?? DateTime.UtcNow,
            Description = request.Description
        };

        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetIssueWorkLogs), new { issueId }, result);
    }

    [HttpDelete("/api/v1/issues/{issueId:guid}/work-logs/{workLogId:guid}")]
    public async Task<ActionResult> DeleteWorkLog(Guid issueId, Guid workLogId, CancellationToken cancellationToken)
    {
        await Mediator.Send(new DeleteWorkLogCommand(issueId, workLogId), cancellationToken);
        return NoContent();
    }
}

public class CreateWorkLogRequest
{
    public int TimeSpentMinutes { get; set; }
    public DateTime? StartedAt { get; set; }
    public string? Description { get; set; }
}
