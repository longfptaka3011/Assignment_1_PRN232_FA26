using Microsoft.AspNetCore.Mvc;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Services;

namespace TaskTrack.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    /// <summary>
    /// List all active tasks
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskDto>>> GetAll()
    {
        var tasks = await _taskService.GetAllActiveAsync();
        return Ok(tasks);
    }

    /// <summary>
    /// Filter tasks (all params optional: title, status, priority, projectId, tagId)
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<TaskDto>>> Search(
        [FromQuery] string? title,
        [FromQuery] short? status,
        [FromQuery] short? priority,
        [FromQuery] int? projectId,
        [FromQuery] int? tagId)
    {
        var results = await _taskService.SearchAsync(title, status, priority, projectId, tagId);
        return Ok(results);
    }

    /// <summary>
    /// Get one task including its tags
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<TaskDetailDto>> GetById(int id)
    {
        var task = await _taskService.GetByIdWithTagsAsync(id);
        if (task == null)
            return NotFound(new { message = $"Task with ID {id} not found." });

        return Ok(task);
    }

    /// <summary>
    /// Get tasks by project
    /// </summary>
    [HttpGet("project/{projectId:int}")]
    public async Task<ActionResult<IEnumerable<TaskDto>>> GetByProject(int projectId)
    {
        var tasks = await _taskService.GetByProjectIdAsync(projectId);
        return Ok(tasks);
    }

    /// <summary>
    /// Create a task (accept optional TagIDs array)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TaskDto>> Create([FromBody] CreateTaskDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var created = await _taskService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.TaskId }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update a task; replace its tags; set ModifiedDate to now
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<TaskDto>> Update(int id, [FromBody] UpdateTaskDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var updated = await _taskService.UpdateAsync(id, dto);
            if (updated == null)
                return NotFound(new { message = $"Task with ID {id} not found." });

            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Soft-delete: set IsActive = false, never hard-delete
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _taskService.SoftDeleteAsync(id);
        if (!success)
            return NotFound(new { message = $"Task with ID {id} not found." });

        return NoContent();
    }
}
