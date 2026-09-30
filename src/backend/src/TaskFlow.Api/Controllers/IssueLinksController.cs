using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Features.IssueLinks.Commands.CreateIssueLink;
using TaskFlow.Application.Features.IssueLinks.Commands.DeleteIssueLink;
using TaskFlow.Application.Features.IssueLinks.DTOs;
using TaskFlow.Application.Features.IssueLinks.Queries.GetIssueLinks;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Api.Controllers;

[Authorize]
public class IssueLinksController : ApiControllerBase
{
    [HttpGet("/api/v1/issues/{issueId:guid}/links")]
    public async Task<ActionResult<List<IssueLinkDto>>> GetIssueLinks(Guid issueId, CancellationToken cancellationToken = default)
    {
        return Ok(await Mediator.Send(new GetIssueLinksQuery(issueId), cancellationToken));
    }

    [HttpPost("/api/v1/issues/{issueId:guid}/links")]
    public async Task<ActionResult<IssueLinkDto>> CreateIssueLink(Guid issueId, [FromBody] CreateIssueLinkRequest request, CancellationToken cancellationToken = default)
    {
        var command = new CreateIssueLinkCommand
        {
            SourceIssueId = issueId,
            TargetIssueId = request.TargetIssueId,
            LinkType = request.LinkType
        };

        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetIssueLinks), new { issueId }, result);
    }

    [HttpDelete("/api/v1/issues/{issueId:guid}/links/{linkId:guid}")]
    public async Task<ActionResult> DeleteIssueLink(Guid issueId, Guid linkId, CancellationToken cancellationToken = default)
    {
        await Mediator.Send(new DeleteIssueLinkCommand(linkId), cancellationToken);
        return NoContent();
    }
}

public class CreateIssueLinkRequest
{
    public Guid TargetIssueId { get; set; }
    public IssueLinkType LinkType { get; set; } = IssueLinkType.RelatesTo;
}
