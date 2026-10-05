using System.ComponentModel.DataAnnotations;

namespace TaskTrack.Service.DTOs;

public class TagDto
{
    public int TagId { get; set; }
    public string TagName { get; set; } = string.Empty;
    public string? Color { get; set; }
}

public class CreateTagDto
{
    [Required(ErrorMessage = "TagName is required.")]
    [MaxLength(50, ErrorMessage = "TagName cannot exceed 50 characters.")]
    public string TagName { get; set; } = string.Empty;

    [MaxLength(7, ErrorMessage = "Color cannot exceed 7 characters (e.g. #3B82F6).")]
    public string? Color { get; set; }
}

public class UpdateTagDto
{
    [Required(ErrorMessage = "TagName is required.")]
    [MaxLength(50, ErrorMessage = "TagName cannot exceed 50 characters.")]
    public string TagName { get; set; } = string.Empty;

    [MaxLength(7, ErrorMessage = "Color cannot exceed 7 characters.")]
    public string? Color { get; set; }
}
