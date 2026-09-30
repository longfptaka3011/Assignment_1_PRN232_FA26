using TaskFlow.Domain.Common;

namespace TaskFlow.Domain.Entities;

public class Project : BaseAuditableEntity, IAggregateRoot
{
    public string Name { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid LeadId { get; set; }
    public int IssueCounter { get; set; } = 0;
    public bool IsArchived { get; set; } = false;

    // Navigation properties
    public Profile Lead { get; set; } = null!;
    public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
    public ICollection<IssueType> IssueTypes { get; set; } = new List<IssueType>();
    public ICollection<IssueStatus> IssueStatuses { get; set; } = new List<IssueStatus>();
    public ICollection<Sprint> Sprints { get; set; } = new List<Sprint>();
    public ICollection<Issue> Issues { get; set; } = new List<Issue>();
    public ICollection<Label> Labels { get; set; } = new List<Label>();
    public ICollection<WorkflowTransition> WorkflowTransitions { get; set; } = new List<WorkflowTransition>();
    public ICollection<SavedFilter> SavedFilters { get; set; } = new List<SavedFilter>();
}

