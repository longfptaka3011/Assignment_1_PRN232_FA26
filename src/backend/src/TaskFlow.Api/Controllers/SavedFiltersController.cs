using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Features.SavedFilters.Commands.CreateSavedFilter;
using TaskFlow.Application.Features.SavedFilters.Commands.DeleteSavedFilter;
using TaskFlow.Application.Features.SavedFilters.Commands.UpdateSavedFilter;
using TaskFlow.Application.Features.SavedFilters.DTOs;
using TaskFlow.Application.Features.SavedFilters.Queries.GetSavedFilters;

namespace TaskFlow.Api.Controllers;

[Authorize]
public class SavedFiltersController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<SavedFilterDto>>> GetSavedFilters([FromQuery] Guid? projectId = null, CancellationToken cancellationToken = default)
    {
        return Ok(await Mediator.Send(new GetSavedFiltersQuery(projectId), cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<SavedFilterDto>> CreateSavedFilter([FromBody] CreateSavedFilterCommand command, CancellationToken cancellationToken = default)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetSavedFilters), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SavedFilterDto>> UpdateSavedFilter(Guid id, [FromBody] UpdateSavedFilterRequest request, CancellationToken cancellationToken = default)
    {
        var command = new UpdateSavedFilterCommand
        {
            Id = id,
            Name = request.Name,
            FilterQuery = request.FilterQuery,
            IsFavorite = request.IsFavorite
        };

        return Ok(await Mediator.Send(command, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteSavedFilter(Guid id, CancellationToken cancellationToken = default)
    {
        await Mediator.Send(new DeleteSavedFilterCommand(id), cancellationToken);
        return NoContent();
    }
}

public class UpdateSavedFilterRequest
{
    public string Name { get; set; } = string.Empty;
    public string FilterQuery { get; set; } = "{}";
    public bool IsFavorite { get; set; }
}
