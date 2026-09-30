namespace TaskFlow.Application.Features.IssueStatuses.DTOs;

public class IssueStatusDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ColorHex { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
    public bool IsCompletedStatus { get; set; }
}
