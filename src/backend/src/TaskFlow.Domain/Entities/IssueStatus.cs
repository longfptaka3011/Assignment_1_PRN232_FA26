using TaskFlow.Domain.Common;

namespace TaskFlow.Domain.Entities;

public class IssueStatus : BaseEntity
{
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ColorHex { get; set; } = "#6B7280";
    public int OrderIndex { get; set; } = 0;
    public bool IsCompletedStatus { get; set; } = false;

    // Navigation properties
    public Project Project { get; set; } = null!;
    public ICollection<Issue> Issues { get; set; } = new List<Issue>();
    public ICollection<WorkflowTransition> OutgoingTransitions { get; set; } = new List<WorkflowTransition>();
    public ICollection<WorkflowTransition> IncomingTransitions { get; set; } = new List<WorkflowTransition>();
}
