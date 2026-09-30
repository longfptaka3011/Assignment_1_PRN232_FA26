using TaskFlow.Domain.Common;

namespace TaskFlow.Domain.Entities;

public class WorkLog : BaseAuditableEntity
{
    public Guid IssueId { get; set; }
    public Guid UserId { get; set; }
    public int TimeSpentMinutes { get; set; }
    public DateTime StartedAt { get; set; }
    public string? Description { get; set; }

    public Issue Issue { get; set; } = null!;
    public Profile User { get; set; } = null!;
}
