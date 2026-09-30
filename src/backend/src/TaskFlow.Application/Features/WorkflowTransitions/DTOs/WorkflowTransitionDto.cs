using System;

namespace TaskFlow.Application.Features.WorkflowTransitions.DTOs;

public class WorkflowTransitionDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid FromStatusId { get; set; }
    public string FromStatusName { get; set; } = string.Empty;
    public string FromStatusColorHex { get; set; } = string.Empty;
    public Guid ToStatusId { get; set; }
    public string ToStatusName { get; set; } = string.Empty;
    public string ToStatusColorHex { get; set; } = string.Empty;
    public string? Name { get; set; }
}
