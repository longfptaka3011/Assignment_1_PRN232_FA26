using System.ComponentModel.DataAnnotations;

namespace TaskTrack.Service.DTOs;

public class ProjectDto
{
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public short Status { get; set; }
    public int DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
}

public class CreateProjectDto
{
    [Required(ErrorMessage = "ProjectName is required.")]
    [MaxLength(200, ErrorMessage = "ProjectName cannot exceed 200 characters.")]
    public string ProjectName { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required(ErrorMessage = "StartDate is required.")]
    public DateOnly StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    [Range(0, 3, ErrorMessage = "Status must be between 0 and 3 (0=Not Started, 1=In Progress, 2=Completed, 3=On Hold).")]
    public short Status { get; set; } = 0;

    [Required(ErrorMessage = "DepartmentId is required.")]
    public int DepartmentId { get; set; }

    public bool IsActive { get; set; } = true;
}

public class UpdateProjectDto
{
    [Required(ErrorMessage = "ProjectName is required.")]
    [MaxLength(200, ErrorMessage = "ProjectName cannot exceed 200 characters.")]
    public string ProjectName { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required(ErrorMessage = "StartDate is required.")]
    public DateOnly StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    [Range(0, 3, ErrorMessage = "Status must be between 0 and 3.")]
    public short Status { get; set; }

    [Required(ErrorMessage = "DepartmentId is required.")]
    public int DepartmentId { get; set; }

    public bool IsActive { get; set; } = true;
}

public class ProjectDetailDto : ProjectDto
{
    public List<TaskDto> Tasks { get; set; } = new();
}
