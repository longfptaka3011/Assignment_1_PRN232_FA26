using System.ComponentModel.DataAnnotations;

namespace TaskTrack.Service.DTOs;

public class DepartmentDto
{
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string DepartmentDescription { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class CreateDepartmentDto
{
    [Required(ErrorMessage = "DepartmentName is required.")]
    [MaxLength(100, ErrorMessage = "DepartmentName cannot exceed 100 characters.")]
    public string DepartmentName { get; set; } = string.Empty;

    [Required(ErrorMessage = "DepartmentDescription is required.")]
    [MaxLength(300, ErrorMessage = "DepartmentDescription cannot exceed 300 characters.")]
    public string DepartmentDescription { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}

public class UpdateDepartmentDto
{
    [Required(ErrorMessage = "DepartmentName is required.")]
    [MaxLength(100, ErrorMessage = "DepartmentName cannot exceed 100 characters.")]
    public string DepartmentName { get; set; } = string.Empty;

    [Required(ErrorMessage = "DepartmentDescription is required.")]
    [MaxLength(300, ErrorMessage = "DepartmentDescription cannot exceed 300 characters.")]
    public string DepartmentDescription { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}

public class DepartmentDetailDto : DepartmentDto
{
    public List<ProjectDto> Projects { get; set; } = new();
}
