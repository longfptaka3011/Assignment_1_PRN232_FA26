using System;
using System.Collections.Generic;

namespace TaskFlow.Application.Features.Reports.DTOs;

public class BurndownDataPointDto
{
    public string Date { get; set; } = string.Empty;
    public decimal IdealStoryPoints { get; set; }
    public decimal RemainingStoryPoints { get; set; }
    public int RemainingIssues { get; set; }
}

public class SprintBurndownDto
{
    public Guid SprintId { get; set; }
    public string SprintName { get; set; } = string.Empty;
    public decimal TotalStoryPoints { get; set; }
    public int TotalIssues { get; set; }
    public List<BurndownDataPointDto> DataPoints { get; set; } = new();
}

public class SprintVelocityDto
{
    public Guid SprintId { get; set; }
    public string SprintName { get; set; } = string.Empty;
    public decimal CommittedStoryPoints { get; set; }
    public decimal CompletedStoryPoints { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class MemberWorkloadDto
{
    public Guid? UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatarUrl { get; set; }
    public int IssueCount { get; set; }
    public decimal TotalStoryPoints { get; set; }
    public decimal CompletedStoryPoints { get; set; }
    public int CompletedIssueCount { get; set; }
}
