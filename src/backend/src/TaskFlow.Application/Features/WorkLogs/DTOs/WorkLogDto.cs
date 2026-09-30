using System;

namespace TaskFlow.Application.Features.WorkLogs.DTOs;

public class WorkLogDto
{
    public Guid Id { get; set; }
    public Guid IssueId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatarUrl { get; set; }
    public int TimeSpentMinutes { get; set; }
    public DateTime StartedAt { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}
