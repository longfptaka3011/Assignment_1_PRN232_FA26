using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Features.Attachments.Commands.DeleteAttachment;

namespace TaskFlow.Api.Controllers;

[Authorize]
public class AttachmentsController : ApiControllerBase
{
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteAttachment(Guid id, CancellationToken cancellationToken = default)
    {
        await Mediator.Send(new DeleteAttachmentCommand(id), cancellationToken);
        return NoContent();
    }
}
