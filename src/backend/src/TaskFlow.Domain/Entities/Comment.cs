using TaskFlow.Domain.Common;

namespace TaskFlow.Domain.Entities;

public class Comment : BaseAuditableEntity
{
    public Guid IssueId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = string.Empty;

    // Navigation properties
    public Issue Issue { get; set; } = null!;
    public Profile User { get; set; } = null!;
}
