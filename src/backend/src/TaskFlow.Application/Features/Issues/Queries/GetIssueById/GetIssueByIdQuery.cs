using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.ActivityLogs.DTOs;
using TaskFlow.Application.Features.Attachments.DTOs;
using TaskFlow.Application.Features.Comments.DTOs;
using TaskFlow.Application.Features.Issues.DTOs;
using TaskFlow.Application.Features.Labels.DTOs;

namespace TaskFlow.Application.Features.Issues.Queries.GetIssueById;

public record GetIssueByIdQuery(Guid Id) : IRequest<IssueDetailDto>;

public class GetIssueByIdQueryHandler : IRequestHandler<GetIssueByIdQuery, IssueDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ISupabaseStorageService _storageService;
    private readonly IProjectAuthorizationService _projectAuthService;

    public GetIssueByIdQueryHandler(
        IApplicationDbContext context,
        ISupabaseStorageService storageService,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _storageService = storageService;
        _projectAuthService = projectAuthService;
    }

    public async Task<IssueDetailDto> Handle(GetIssueByIdQuery request, CancellationToken cancellationToken)
    {
        var issue = await _context.Issues
            .AsNoTracking()
            .Include(i => i.Type)
            .Include(i => i.Status)
            .Include(i => i.Assignee)
            .Include(i => i.Reporter)
            .Include(i => i.Sprint)
            .Include(i => i.IssueLabels)
                .ThenInclude(il => il.Label)
            .Include(i => i.Comments.Where(c => c.DeletedAt == null))
                .ThenInclude(c => c.User)
            .Include(i => i.Attachments)
                .ThenInclude(a => a.User)
            .Include(i => i.ActivityLogs)
                .ThenInclude(al => al.User)
            .Include(i => i.Subtasks.Where(s => s.DeletedAt == null))
                .ThenInclude(s => s.Status)
            .Include(i => i.Subtasks.Where(s => s.DeletedAt == null))
                .ThenInclude(s => s.Type)
            .Include(i => i.Subtasks.Where(s => s.DeletedAt == null))
                .ThenInclude(s => s.Assignee)
            .FirstOrDefaultAsync(i => i.Id == request.Id && i.DeletedAt == null, cancellationToken);

        if (issue == null)
        {
            throw new NotFoundException("Issue", request.Id);
        }

        // Anti-IDOR: Verify caller is a member of this project
        await _projectAuthService.EnsureMemberAsync(issue.ProjectId, cancellationToken);

        // Generate signed URLs for attachments
        var attachments = new List<AttachmentDto>();
        foreach (var a in issue.Attachments)
        {
            var downloadUrl = await _storageService.GetSignedUrlAsync("attachments", a.FilePath);
            attachments.Add(new AttachmentDto
            {
                Id = a.Id,
                IssueId = a.IssueId,
                UserId = a.UserId,
                UserName = a.User.FullName,
                FileName = a.FileName,
                FilePath = a.FilePath,
                DownloadUrl = downloadUrl,
                FileSizeBytes = a.FileSizeBytes,
                ContentType = a.ContentType,
                CreatedAt = a.CreatedAt
            });
        }

        return new IssueDetailDto
        {
            Id = issue.Id,
            ProjectId = issue.ProjectId,
            IssueNumber = issue.IssueNumber,
            IssueKey = issue.IssueKey,
            Title = issue.Title,
            Description = issue.Description,
            TypeId = issue.TypeId,
            TypeName = issue.Type.Name,
            TypeIconName = issue.Type.IconName,
            TypeCategory = issue.Type.Category,
            StatusId = issue.StatusId,
            StatusName = issue.Status.Name,
            StatusColorHex = issue.Status.ColorHex,
            IsCompletedStatus = issue.Status.IsCompletedStatus,
            Priority = issue.Priority,
            AssigneeId = issue.AssigneeId,
            AssigneeName = issue.Assignee?.FullName,
            AssigneeAvatarUrl = issue.Assignee?.AvatarUrl,
            ReporterId = issue.ReporterId,
            ReporterName = issue.Reporter.FullName,
            ReporterAvatarUrl = issue.Reporter.AvatarUrl,
            SprintId = issue.SprintId,
            SprintName = issue.Sprint?.Name,
            ParentId = issue.ParentId,
            StoryPoints = issue.StoryPoints,
            Position = issue.Position,
            DueDate = issue.DueDate,
            RowVersion = issue.RowVersion,
            Labels = issue.IssueLabels.Select(il => new LabelDto
            {
                Id = il.Label.Id,
                ProjectId = il.Label.ProjectId,
                Name = il.Label.Name,
                ColorHex = il.Label.ColorHex
            }).ToList(),
            CommentCount = issue.Comments.Count,
            AttachmentCount = issue.Attachments.Count,
            SubtaskCount = issue.Subtasks.Count,
            CreatedAt = issue.CreatedAt,
            UpdatedAt = issue.UpdatedAt,
            Subtasks = issue.Subtasks.Select(s => new IssueDto
            {
                Id = s.Id,
                ProjectId = s.ProjectId,
                IssueNumber = s.IssueNumber,
                IssueKey = s.IssueKey,
                Title = s.Title,
                TypeId = s.TypeId,
                TypeName = s.Type.Name,
                TypeIconName = s.Type.IconName,
                TypeCategory = s.Type.Category,
                StatusId = s.StatusId,
                StatusName = s.Status.Name,
                StatusColorHex = s.Status.ColorHex,
                IsCompletedStatus = s.Status.IsCompletedStatus,
                Priority = s.Priority,
                AssigneeId = s.AssigneeId,
                AssigneeName = s.Assignee?.FullName,
                AssigneeAvatarUrl = s.Assignee?.AvatarUrl,
                StoryPoints = s.StoryPoints,
                Position = s.Position,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            }).ToList(),
            Comments = issue.Comments
                .OrderBy(c => c.CreatedAt)
                .Select(c => new CommentDto
                {
                    Id = c.Id,
                    IssueId = c.IssueId,
                    UserId = c.UserId,
                    UserName = c.User.FullName,
                    UserAvatarUrl = c.User.AvatarUrl,
                    Content = c.Content,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                }).ToList(),
            Attachments = attachments,
            ActivityLogs = issue.ActivityLogs
                .OrderByDescending(al => al.CreatedAt)
                .Select(al => new ActivityLogDto
                {
                    Id = al.Id,
                    IssueId = al.IssueId,
                    UserId = al.UserId,
                    UserName = al.User.FullName,
                    UserAvatarUrl = al.User.AvatarUrl,
                    ActivityType = al.ActivityType,
                    FieldName = al.FieldName,
                    OldValue = al.OldValue,
                    NewValue = al.NewValue,
                    CreatedAt = al.CreatedAt
                }).ToList()
        };
    }
}
