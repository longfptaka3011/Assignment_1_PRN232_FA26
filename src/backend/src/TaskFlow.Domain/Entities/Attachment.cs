using TaskFlow.Domain.Common;

namespace TaskFlow.Domain.Entities;

public class Attachment : BaseEntity
{
    public Guid IssueId { get; set; }
    public Guid UserId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Issue Issue { get; set; } = null!;
    public Profile User { get; set; } = null!;
}
