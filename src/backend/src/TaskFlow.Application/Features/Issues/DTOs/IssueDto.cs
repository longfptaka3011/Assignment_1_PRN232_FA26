using TaskFlow.Application.Features.Labels.DTOs;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Issues.DTOs;

public class IssueDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public int IssueNumber { get; set; }
    public string IssueKey { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public Guid TypeId { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public string TypeIconName { get; set; } = string.Empty;
    public IssueTypeCategory TypeCategory { get; set; }

    public Guid StatusId { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public string StatusColorHex { get; set; } = string.Empty;
    public bool IsCompletedStatus { get; set; }

    public IssuePriority Priority { get; set; }

    public Guid? AssigneeId { get; set; }
    public string? AssigneeName { get; set; }
    public string? AssigneeAvatarUrl { get; set; }

    public Guid ReporterId { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public string? ReporterAvatarUrl { get; set; }

    public Guid? SprintId { get; set; }
    public string? SprintName { get; set; }

    public Guid? ParentId { get; set; }
    public decimal? StoryPoints { get; set; }
    public string Position { get; set; } = "0|hzzzzz:";
    public DateOnly? DueDate { get; set; }
    public uint RowVersion { get; set; }

    public List<LabelDto> Labels { get; set; } = new();
    public int CommentCount { get; set; }
    public int AttachmentCount { get; set; }
    public int SubtaskCount { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
