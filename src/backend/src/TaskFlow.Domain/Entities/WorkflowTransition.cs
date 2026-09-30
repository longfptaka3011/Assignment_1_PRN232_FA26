using TaskFlow.Domain.Common;

namespace TaskFlow.Domain.Entities;

public class WorkflowTransition : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Guid FromStatusId { get; set; }
    public Guid ToStatusId { get; set; }
    public string? Name { get; set; }

    public Project Project { get; set; } = null!;
    public IssueStatus FromStatus { get; set; } = null!;
    public IssueStatus ToStatus { get; set; } = null!;
}
