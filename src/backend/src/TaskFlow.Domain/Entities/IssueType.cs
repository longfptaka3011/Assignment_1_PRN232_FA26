using TaskFlow.Domain.Common;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Domain.Entities;

public class IssueType : BaseEntity
{
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string IconName { get; set; } = "bookmark";
    public IssueTypeCategory Category { get; set; } = IssueTypeCategory.Task;
    public int OrderIndex { get; set; } = 0;
    public bool IsSubtask { get; set; } = false;

    // Navigation properties
    public Project Project { get; set; } = null!;
    public ICollection<Issue> Issues { get; set; } = new List<Issue>();
}
