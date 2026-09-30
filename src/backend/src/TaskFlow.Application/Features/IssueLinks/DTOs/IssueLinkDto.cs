using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.IssueLinks.DTOs;

public class IssueLinkDto
{
    public Guid Id { get; set; }
    public Guid SourceIssueId { get; set; }
    public string SourceIssueKey { get; set; } = string.Empty;
    public string SourceTitle { get; set; } = string.Empty;

    public Guid TargetIssueId { get; set; }
    public string TargetIssueKey { get; set; } = string.Empty;
    public string TargetTitle { get; set; } = string.Empty;
    public string TargetStatusName { get; set; } = string.Empty;
    public string TargetStatusColorHex { get; set; } = string.Empty;

    public IssueLinkType LinkType { get; set; }
    public string RelationshipText { get; set; } = string.Empty; // e.g. "blocks", "is blocked by"

    public Guid CreatedBy { get; set; }
    public string CreatorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
