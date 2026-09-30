using TaskFlow.Domain.Common;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Domain.Entities;

public class IssueLink : BaseEntity
{
    public Guid SourceIssueId { get; set; }
    public Guid TargetIssueId { get; set; }
    public IssueLinkType LinkType { get; set; } = IssueLinkType.RelatesTo;
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Issue SourceIssue { get; set; } = null!;
    public Issue TargetIssue { get; set; } = null!;
    public Profile Creator { get; set; } = null!;
}
