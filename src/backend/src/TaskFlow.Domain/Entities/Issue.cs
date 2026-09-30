using TaskFlow.Domain.Common;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Domain.Entities;

public class Issue : BaseAuditableEntity, IAggregateRoot
{
    public Guid ProjectId { get; set; }
    public int IssueNumber { get; set; }
    public string IssueKey { get; set; } = string.Empty; // e.g. "TF-1"
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid TypeId { get; set; }
    public Guid StatusId { get; set; }
    public IssuePriority Priority { get; set; } = IssuePriority.Medium;
    public Guid? AssigneeId { get; set; }
    public Guid ReporterId { get; set; }
    public Guid? SprintId { get; set; }
    public Guid? ParentId { get; set; }
    public decimal? StoryPoints { get; set; }
    public string Position { get; set; } = "0|hzzzzz:"; // LexoRank string
    public DateOnly? DueDate { get; set; }

    // Concurrency token (PostgreSQL xmin)
    public uint RowVersion { get; set; }

    // Navigation properties
    public Project Project { get; set; } = null!;
    public IssueType Type { get; set; } = null!;
    public IssueStatus Status { get; set; } = null!;
    public Profile? Assignee { get; set; }
    public Profile Reporter { get; set; } = null!;
    public Sprint? Sprint { get; set; }
    public Issue? Parent { get; set; }
    public ICollection<Issue> Subtasks { get; set; } = new List<Issue>();
    public ICollection<IssueLabel> IssueLabels { get; set; } = new List<IssueLabel>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
    public ICollection<IssueLink> IssueLinksAsSource { get; set; } = new List<IssueLink>();
    public ICollection<IssueLink> IssueLinksAsTarget { get; set; } = new List<IssueLink>();
    public ICollection<IssueWatcher> Watchers { get; set; } = new List<IssueWatcher>();
    public ICollection<WorkLog> WorkLogs { get; set; } = new List<WorkLog>();
}
