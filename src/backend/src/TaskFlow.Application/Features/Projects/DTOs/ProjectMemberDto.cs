using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Projects.DTOs;

public class ProjectMemberDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public ProjectRole Role { get; set; }
    public DateTime JoinedAt { get; set; }
}
