using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Features.Labels.Commands;

namespace TaskFlow.Api.Controllers;

[Authorize]
public class LabelsController : ApiControllerBase
{
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteLabel(Guid id, CancellationToken cancellationToken = default)
    {
        await Mediator.Send(new DeleteLabelCommand(id), cancellationToken);
        return NoContent();
    }
}
