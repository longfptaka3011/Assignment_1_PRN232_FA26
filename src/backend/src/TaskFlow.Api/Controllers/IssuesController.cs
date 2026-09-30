using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Common.Models;
using TaskFlow.Application.Features.ActivityLogs.DTOs;
using TaskFlow.Application.Features.ActivityLogs.Queries.GetIssueActivityLogs;
using TaskFlow.Application.Features.Attachments.Commands.CreateAttachment;
using TaskFlow.Application.Features.Attachments.DTOs;
using TaskFlow.Application.Features.Attachments.Queries.GetAttachmentsByIssue;
using TaskFlow.Application.Features.Comments.Commands.CreateComment;
using TaskFlow.Application.Features.Comments.DTOs;
using TaskFlow.Application.Features.Comments.Queries.GetCommentsByIssue;
using TaskFlow.Application.Features.Issues.Commands.CreateIssue;
using TaskFlow.Application.Features.Issues.Commands.DeleteIssue;
using TaskFlow.Application.Features.Issues.Commands.MoveIssue;
using TaskFlow.Application.Features.Issues.Commands.UpdateIssue;
using TaskFlow.Application.Features.Issues.DTOs;
using TaskFlow.Application.Features.Issues.Queries.GetIssueById;
using TaskFlow.Application.Features.Issues.Queries.GetIssueByKey;
using TaskFlow.Application.Features.Issues.Queries.GetIssues;

namespace TaskFlow.Api.Controllers;

[Authorize]
public class IssuesController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PaginatedList<IssueDto>>> GetIssues([FromQuery] GetIssuesQuery query, CancellationToken cancellationToken)
    {
        return Ok(await Mediator.Send(query, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<IssueDetailDto>> GetIssueById(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await Mediator.Send(new GetIssueByIdQuery(id), cancellationToken));
    }

    [HttpGet("key/{issueKey}")]
    public async Task<ActionResult<IssueDetailDto>> GetIssueByKey(string issueKey, CancellationToken cancellationToken)
    {
        return Ok(await Mediator.Send(new GetIssueByKeyQuery(issueKey), cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<IssueDto>> CreateIssue([FromBody] CreateIssueCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetIssueById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<IssueDto>> UpdateIssue(Guid id, [FromBody] UpdateIssueCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest("Path ID must match request ID.");
        }

        return Ok(await Mediator.Send(command, cancellationToken));
    }

    [HttpPost("{id:guid}/move")]
    public async Task<ActionResult<IssueDto>> MoveIssue(Guid id, [FromBody] MoveIssueRequest request, CancellationToken cancellationToken)
    {
        var command = new MoveIssueCommand
        {
            IssueId = id,
            TargetStatusId = request.TargetStatusId,
            TargetSprintId = request.TargetSprintId,
            UpdateSprint = request.UpdateSprint,
            PreviousIssueId = request.PreviousIssueId,
            NextIssueId = request.NextIssueId,
            RowVersion = request.RowVersion
        };

        return Ok(await Mediator.Send(command, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteIssue(Guid id, CancellationToken cancellationToken)
    {
        await Mediator.Send(new DeleteIssueCommand(id), cancellationToken);
        return NoContent();
    }

    // --- Comments ---

    [HttpGet("{issueId:guid}/comments")]
    public async Task<ActionResult<List<CommentDto>>> GetComments(Guid issueId, CancellationToken cancellationToken)
    {
        return Ok(await Mediator.Send(new GetCommentsByIssueQuery(issueId), cancellationToken));
    }

    [HttpPost("{issueId:guid}/comments")]
    public async Task<ActionResult<CommentDto>> CreateComment(Guid issueId, [FromBody] CreateCommentRequest request, CancellationToken cancellationToken)
    {
        var command = new CreateCommentCommand
        {
            IssueId = issueId,
            Content = request.Content
        };

        return Ok(await Mediator.Send(command, cancellationToken));
    }

    // --- Attachments ---

    [HttpGet("{issueId:guid}/attachments")]
    public async Task<ActionResult<List<AttachmentDto>>> GetAttachments(Guid issueId, CancellationToken cancellationToken)
    {
        return Ok(await Mediator.Send(new GetAttachmentsByIssueQuery(issueId), cancellationToken));
    }

    [HttpPost("{issueId:guid}/attachments")]
    public async Task<ActionResult<AttachmentDto>> CreateAttachment(Guid issueId, [FromBody] CreateAttachmentRequest request, CancellationToken cancellationToken)
    {
        var command = new CreateAttachmentCommand
        {
            IssueId = issueId,
            FileName = request.FileName,
            FilePath = request.FilePath,
            FileSizeBytes = request.FileSizeBytes,
            ContentType = request.ContentType
        };

        return Ok(await Mediator.Send(command, cancellationToken));
    }

    // --- Activity Logs ---

    [HttpGet("{issueId:guid}/activity")]
    public async Task<ActionResult<List<ActivityLogDto>>> GetActivity(Guid issueId, CancellationToken cancellationToken)
    {
        return Ok(await Mediator.Send(new GetIssueActivityLogsQuery(issueId), cancellationToken));
    }
}

public class MoveIssueRequest
{
    public Guid? TargetStatusId { get; set; }
    public Guid? TargetSprintId { get; set; }
    public bool UpdateSprint { get; set; } = false;
    public Guid? PreviousIssueId { get; set; }
    public Guid? NextIssueId { get; set; }
    public uint RowVersion { get; set; }
}

public class CreateCommentRequest
{
    public string Content { get; set; } = string.Empty;
}

public class CreateAttachmentRequest
{
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string ContentType { get; set; } = string.Empty;
}
