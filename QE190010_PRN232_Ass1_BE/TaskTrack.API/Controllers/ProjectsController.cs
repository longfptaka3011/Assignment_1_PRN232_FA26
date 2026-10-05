using Microsoft.AspNetCore.Mvc;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Services;

namespace TaskTrack.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projService;

    public ProjectsController(IProjectService projService)
    {
        _projService = projService;
    }

    /// <summary>
    /// List all active projects (include department name)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetAll()
    {
        var projects = await _projService.GetAllActiveAsync();
        return Ok(projects);
    }

    /// <summary>
    /// Filter projects (all params optional: name, status, departmentId)
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> Search(
        [FromQuery] string? name,
        [FromQuery] short? status,
        [FromQuery] int? departmentId)
    {
        var results = await _projService.SearchAsync(name, status, departmentId);
        return Ok(results);
    }

    /// <summary>
    /// Get one project and its tasks
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProjectDetailDto>> GetById(int id)
    {
        var project = await _projService.GetByIdWithTasksAsync(id);
        if (project == null)
            return NotFound(new { message = $"Project with ID {id} not found." });

        return Ok(project);
    }

    /// <summary>
    /// Get projects by department
    /// </summary>
    [HttpGet("department/{departmentId:int}")]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetByDepartment(int departmentId)
    {
        var projects = await _projService.GetByDepartmentIdAsync(departmentId);
        return Ok(projects);
    }

    /// <summary>
    /// Create a new project
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ProjectDto>> Create([FromBody] CreateProjectDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var created = await _projService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.ProjectId }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update a project
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProjectDto>> Update(int id, [FromBody] UpdateProjectDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var updated = await _projService.UpdateAsync(id, dto);
            if (updated == null)
                return NotFound(new { message = $"Project with ID {id} not found." });

            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Delete only if no tasks are linked; otherwise return HTTP 400
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var (success, errorMessage) = await _projService.DeleteAsync(id);
        if (!success)
        {
            if (errorMessage == "Project not found.")
                return NotFound(new { message = errorMessage });

            return BadRequest(new { message = errorMessage });
        }

        return NoContent();
    }
}
