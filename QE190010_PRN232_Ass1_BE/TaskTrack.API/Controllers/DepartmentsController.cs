using Microsoft.AspNetCore.Mvc;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Services;

namespace TaskTrack.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartmentsController : ControllerBase
{
    private readonly IDepartmentService _deptService;

    public DepartmentsController(IDepartmentService deptService)
    {
        _deptService = deptService;
    }

    /// <summary>
    /// List all active departments
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DepartmentDto>>> GetAll()
    {
        var departments = await _deptService.GetAllActiveAsync();
        return Ok(departments);
    }

    /// <summary>
    /// Search departments by name (partial match)
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<DepartmentDto>>> Search([FromQuery] string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            var all = await _deptService.GetAllActiveAsync();
            return Ok(all);
        }
        var results = await _deptService.SearchByNameAsync(name);
        return Ok(results);
    }

    /// <summary>
    /// Get one department and its projects
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<DepartmentDetailDto>> GetById(int id)
    {
        var dept = await _deptService.GetByIdWithProjectsAsync(id);
        if (dept == null)
            return NotFound(new { message = $"Department with ID {id} not found." });

        return Ok(dept);
    }

    /// <summary>
    /// Create a new department
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<DepartmentDto>> Create([FromBody] CreateDepartmentDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var created = await _deptService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.DepartmentId }, created);
    }

    /// <summary>
    /// Update a department
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<DepartmentDto>> Update(int id, [FromBody] UpdateDepartmentDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var updated = await _deptService.UpdateAsync(id, dto);
        if (updated == null)
            return NotFound(new { message = $"Department with ID {id} not found." });

        return Ok(updated);
    }

    /// <summary>
    /// Delete only if no projects are linked; otherwise return HTTP 400
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var (success, errorMessage) = await _deptService.DeleteAsync(id);
        if (!success)
        {
            if (errorMessage == "Department not found.")
                return NotFound(new { message = errorMessage });

            return BadRequest(new { message = errorMessage });
        }

        return NoContent();
    }
}
