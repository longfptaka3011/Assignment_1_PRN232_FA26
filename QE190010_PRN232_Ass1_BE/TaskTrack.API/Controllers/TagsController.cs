using Microsoft.AspNetCore.Mvc;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Services;

namespace TaskTrack.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TagsController : ControllerBase
{
    private readonly ITagService _tagService;

    public TagsController(ITagService tagService)
    {
        _tagService = tagService;
    }

    /// <summary>
    /// List all tags
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TagDto>>> GetAll()
    {
        var tags = await _tagService.GetAllAsync();
        return Ok(tags);
    }

    /// <summary>
    /// Get one tag by ID
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<TagDto>> GetById(int id)
    {
        var tag = await _tagService.GetByIdAsync(id);
        if (tag == null)
            return NotFound(new { message = $"Tag with ID {id} not found." });

        return Ok(tag);
    }

    /// <summary>
    /// Create a tag
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TagDto>> Create([FromBody] CreateTagDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var created = await _tagService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.TagId }, created);
    }

    /// <summary>
    /// Update a tag
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<TagDto>> Update(int id, [FromBody] UpdateTagDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var updated = await _tagService.UpdateAsync(id, dto);
        if (updated == null)
            return NotFound(new { message = $"Tag with ID {id} not found." });

        return Ok(updated);
    }

    /// <summary>
    /// Delete only if not used by any task; otherwise return HTTP 400
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var (success, errorMessage) = await _tagService.DeleteAsync(id);
        if (!success)
        {
            if (errorMessage == "Tag not found.")
                return NotFound(new { message = errorMessage });

            return BadRequest(new { message = errorMessage });
        }

        return NoContent();
    }
}
