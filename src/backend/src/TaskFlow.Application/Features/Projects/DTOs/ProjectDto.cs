namespace TaskFlow.Application.Features.Projects.DTOs;

public class ProjectDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid LeadId { get; set; }
    public string LeadName { get; set; } = string.Empty;
    public string? LeadAvatarUrl { get; set; }
    public int IssueCounter { get; set; }
    public bool IsArchived { get; set; }
    public int MemberCount { get; set; }
    public int IssueCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
