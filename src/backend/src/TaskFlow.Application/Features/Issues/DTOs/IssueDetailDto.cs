using TaskFlow.Application.Features.ActivityLogs.DTOs;
using TaskFlow.Application.Features.Attachments.DTOs;
using TaskFlow.Application.Features.Comments.DTOs;

namespace TaskFlow.Application.Features.Issues.DTOs;

public class IssueDetailDto : IssueDto
{
    public List<IssueDto> Subtasks { get; set; } = new();
    public List<CommentDto> Comments { get; set; } = new();
    public List<AttachmentDto> Attachments { get; set; } = new();
    public List<ActivityLogDto> ActivityLogs { get; set; } = new();
}
