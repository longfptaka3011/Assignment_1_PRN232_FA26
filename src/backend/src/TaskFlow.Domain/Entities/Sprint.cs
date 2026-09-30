using TaskFlow.Domain.Common;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Domain.Entities;

public class Sprint : BaseAuditableEntity, IAggregateRoot
{
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Goal { get; set; }
    public SprintStatus Status { get; set; } = SprintStatus.Planned;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Navigation properties
    public Project Project { get; set; } = null!;
    public ICollection<Issue> Issues { get; set; } = new List<Issue>();

    public void Start(DateTime startDate, DateTime endDate)
    {
        if (Status != SprintStatus.Planned)
            throw new InvalidOperationException("Only planned sprints can be started.");

        Status = SprintStatus.Active;
        StartDate = startDate;
        EndDate = endDate;
    }

    public void Complete()
    {
        if (Status != SprintStatus.Active)
            throw new InvalidOperationException("Only active sprints can be completed.");

        Status = SprintStatus.Completed;
        CompletedAt = DateTime.UtcNow;
    }
}
