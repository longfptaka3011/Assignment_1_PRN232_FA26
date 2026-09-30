using TaskFlow.Domain.Common;

namespace TaskFlow.Domain.Entities;

public class Label : BaseEntity
{
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ColorHex { get; set; } = "#3B82F6";

    // Navigation properties
    public Project Project { get; set; } = null!;
    public ICollection<IssueLabel> IssueLabels { get; set; } = new List<IssueLabel>();
}
