using TaskFlow.Application.Features.IssueStatuses.DTOs;
using TaskFlow.Application.Features.IssueTypes.DTOs;
using TaskFlow.Application.Features.Labels.DTOs;

namespace TaskFlow.Application.Features.Projects.DTOs;

public class ProjectDetailDto : ProjectDto
{
    public List<ProjectMemberDto> Members { get; set; } = new();
    public List<IssueTypeDto> IssueTypes { get; set; } = new();
    public List<IssueStatusDto> IssueStatuses { get; set; } = new();
    public List<LabelDto> Labels { get; set; } = new();
}
