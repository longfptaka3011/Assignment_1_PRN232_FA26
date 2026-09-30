namespace TaskFlow.Domain.Entities;

public class IssueWatcher
{
    public Guid IssueId { get; set; }
    public Guid UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Issue Issue { get; set; } = null!;
    public Profile User { get; set; } = null!;
}
