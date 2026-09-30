using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Sprints.DTOs;

public class SprintDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Goal { get; set; }
    public SprintStatus Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int IssueCount { get; set; }
    public decimal TotalStoryPoints { get; set; }
    public decimal CompletedStoryPoints { get; set; }
    public DateTime CreatedAt { get; set; }
}
