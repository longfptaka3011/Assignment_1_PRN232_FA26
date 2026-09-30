using TaskFlow.Domain.Common;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Domain.Entities;

public class ActivityLog : BaseEntity
{
    public Guid IssueId { get; set; }
    public Guid UserId { get; set; }
    public ActivityType ActivityType { get; set; }
    public string? FieldName { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Issue Issue { get; set; } = null!;
    public Profile User { get; set; } = null!;
}
