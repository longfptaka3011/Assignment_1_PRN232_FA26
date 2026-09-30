using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.IssueTypes.DTOs;

public class IssueTypeDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string IconName { get; set; } = string.Empty;
    public IssueTypeCategory Category { get; set; }
    public int OrderIndex { get; set; }
    public bool IsSubtask { get; set; }
}
