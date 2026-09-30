using TaskFlow.Application.Features.Issues.DTOs;

namespace TaskFlow.Application.Features.Sprints.DTOs;

public class SprintDetailDto : SprintDto
{
    public List<IssueDto> Issues { get; set; } = new();
}
