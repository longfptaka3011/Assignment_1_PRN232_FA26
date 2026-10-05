using System.ComponentModel.DataAnnotations;

namespace TaskTrack.Service.DTOs;

public class TaskDto
{
    public int TaskId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public short Status { get; set; }
    public short Priority { get; set; }
    public DateOnly? DueDate { get; set; }
    public int ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public List<TagDto> Tags { get; set; } = new();
}

public class CreateTaskDto
{
    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(300, ErrorMessage = "Title cannot exceed 300 characters.")]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Range(0, 3, ErrorMessage = "Status must be between 0 and 3 (0=To Do, 1=In Progress, 2=Done, 3=Cancelled).")]
    public short Status { get; set; } = 0;

    [Range(0, 3, ErrorMessage = "Priority must be between 0 and 3 (0=Low, 1=Medium, 2=High, 3=Critical).")]
    public short Priority { get; set; } = 1;

    public DateOnly? DueDate { get; set; }

    [Required(ErrorMessage = "ProjectId is required.")]
    public int ProjectId { get; set; }

    public bool IsActive { get; set; } = true;

    public List<int>? TagIds { get; set; } = new();
}

public class UpdateTaskDto
{
    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(300, ErrorMessage = "Title cannot exceed 300 characters.")]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Range(0, 3, ErrorMessage = "Status must be between 0 and 3.")]
    public short Status { get; set; }

    [Range(0, 3, ErrorMessage = "Priority must be between 0 and 3.")]
    public short Priority { get; set; }

    public DateOnly? DueDate { get; set; }

    [Required(ErrorMessage = "ProjectId is required.")]
    public int ProjectId { get; set; }

    public bool IsActive { get; set; } = true;

    public List<int>? TagIds { get; set; } = new();
}

public class TaskDetailDto : TaskDto
{
}
