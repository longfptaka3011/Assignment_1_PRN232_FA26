using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Features.Comments.Commands.DeleteComment;
using TaskFlow.Application.Features.Comments.Commands.UpdateComment;
using TaskFlow.Application.Features.Comments.DTOs;

namespace TaskFlow.Api.Controllers;

[Authorize]
public class CommentsController : ApiControllerBase
{
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CommentDto>> UpdateComment(Guid id, [FromBody] UpdateCommentRequest request, CancellationToken cancellationToken = default)
    {
        var command = new UpdateCommentCommand
        {
            Id = id,
            Content = request.Content
        };

        return Ok(await Mediator.Send(command, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteComment(Guid id, CancellationToken cancellationToken = default)
    {
        await Mediator.Send(new DeleteCommentCommand(id), cancellationToken);
        return NoContent();
    }
}

public class UpdateCommentRequest
{
    public string Content { get; set; } = string.Empty;
}
