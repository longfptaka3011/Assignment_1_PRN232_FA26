using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Common.Utilities;
using TaskFlow.Application.Features.Issues.DTOs;
using TaskFlow.Application.Features.Labels.DTOs;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Issues.Commands.MoveIssue;

public record MoveIssueCommand : IRequest<IssueDto>
{
    public Guid IssueId { get; init; }
    public Guid? TargetStatusId { get; init; }
    public Guid? TargetSprintId { get; init; }
    public bool UpdateSprint { get; init; } = false; // Flag to explicitly allow setting sprint to null (backlog)
    public Guid? PreviousIssueId { get; init; }
    public Guid? NextIssueId { get; init; }
    public uint RowVersion { get; init; }
    public string? Comment { get; init; }
    public string? Resolution { get; init; }
}

public class MoveIssueCommandValidator : AbstractValidator<MoveIssueCommand>
{
    public MoveIssueCommandValidator()
    {
        RuleFor(v => v.IssueId).NotEmpty();
    }
}

public class MoveIssueCommandHandler : IRequestHandler<MoveIssueCommand, IssueDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IProjectAuthorizationService _projectAuthService;

    public MoveIssueCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _projectAuthService = projectAuthService;
    }

    public async Task<IssueDto> Handle(MoveIssueCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var issue = await _context.Issues
            .Include(i => i.Type)
            .Include(i => i.Status)
            .Include(i => i.Assignee)
            .Include(i => i.Reporter)
            .Include(i => i.Sprint)
            .Include(i => i.IssueLabels)
                .ThenInclude(il => il.Label)
            .Include(i => i.Comments.Where(c => c.DeletedAt == null))
            .Include(i => i.Attachments)
            .Include(i => i.Subtasks.Where(s => s.DeletedAt == null))
            .FirstOrDefaultAsync(i => i.Id == request.IssueId && i.DeletedAt == null, cancellationToken);

        if (issue == null)
        {
            throw new NotFoundException("Issue", request.IssueId);
        }

        // Anti-IDOR: Verify caller has Member/Admin/Owner role
        await _projectAuthService.EnsureRoleAsync(
            issue.ProjectId,
            new[] { ProjectRole.Owner, ProjectRole.Admin, ProjectRole.Member },
            cancellationToken);

        // Concurrency check
        if (request.RowVersion > 0 && issue.RowVersion != request.RowVersion)
        {
            throw new ConflictException("This issue was moved or edited by someone else. Please refresh your board.");
        }

        // Check if status changed
        if (request.TargetStatusId.HasValue && request.TargetStatusId.Value != issue.StatusId)
        {
            var newStatus = await _context.IssueStatuses
                .FirstOrDefaultAsync(s => s.Id == request.TargetStatusId.Value && s.ProjectId == issue.ProjectId, cancellationToken);

            if (newStatus == null)
            {
                throw new NotFoundException("IssueStatus", request.TargetStatusId.Value);
            }

            // Workflow transition validation (Nhóm C - Workflow Engine)
            var hasConfiguredTransitions = await _context.WorkflowTransitions
                .AnyAsync(t => t.ProjectId == issue.ProjectId, cancellationToken);

            if (hasConfiguredTransitions)
            {
                var isTransitionAllowed = await _context.WorkflowTransitions
                    .AnyAsync(t => t.ProjectId == issue.ProjectId && t.FromStatusId == issue.StatusId && t.ToStatusId == newStatus.Id, cancellationToken);

                if (!isTransitionAllowed)
                {
                    throw new TaskFlow.Application.Common.Exceptions.ValidationException(
                        "StatusTransition",
                        $"Transition from '{issue.Status.Name}' to '{newStatus.Name}' is not allowed by project workflow.");
                }
            }

            // Record resolution/comment if transitioning to completed status
            if (newStatus.IsCompletedStatus && (!string.IsNullOrWhiteSpace(request.Resolution) || !string.IsNullOrWhiteSpace(request.Comment)))
            {
                var resolutionText = !string.IsNullOrWhiteSpace(request.Resolution) ? $"[Resolution: {request.Resolution}] " : "";
                var commentContent = $"{resolutionText}{request.Comment ?? "Issue completed."}".Trim();

                _context.Comments.Add(new Comment
                {
                    Id = Guid.NewGuid(),
                    IssueId = issue.Id,
                    UserId = currentUserId.Value,
                    Content = commentContent,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            _context.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                IssueId = issue.Id,
                UserId = currentUserId.Value,
                ActivityType = ActivityType.StatusChanged,
                FieldName = "Status",
                OldValue = issue.Status.Name,
                NewValue = newStatus.Name,
                CreatedAt = DateTime.UtcNow
            });

            issue.StatusId = newStatus.Id;
            issue.Status = newStatus;
        }

        // Check if sprint changed
        if (request.UpdateSprint)
        {
            if (request.TargetSprintId.HasValue)
            {
                var newSprint = await _context.Sprints
                    .FirstOrDefaultAsync(s => s.Id == request.TargetSprintId.Value && s.ProjectId == issue.ProjectId && s.DeletedAt == null, cancellationToken);

                if (newSprint == null)
                {
                    throw new NotFoundException("Sprint", request.TargetSprintId.Value);
                }

                if (issue.SprintId != newSprint.Id)
                {
                    _context.ActivityLogs.Add(new ActivityLog
                    {
                        Id = Guid.NewGuid(),
                        IssueId = issue.Id,
                        UserId = currentUserId.Value,
                        ActivityType = ActivityType.SprintChanged,
                        FieldName = "Sprint",
                        OldValue = issue.Sprint?.Name,
                        NewValue = newSprint.Name,
                        CreatedAt = DateTime.UtcNow
                    });

                    issue.SprintId = newSprint.Id;
                    issue.Sprint = newSprint;
                }
            }
            else
            {
                // Moved to Backlog
                if (issue.SprintId != null)
                {
                    _context.ActivityLogs.Add(new ActivityLog
                    {
                        Id = Guid.NewGuid(),
                        IssueId = issue.Id,
                        UserId = currentUserId.Value,
                        ActivityType = ActivityType.SprintChanged,
                        FieldName = "Sprint",
                        OldValue = issue.Sprint?.Name,
                        NewValue = "Backlog",
                        CreatedAt = DateTime.UtcNow
                    });

                    issue.SprintId = null;
                    issue.Sprint = null;
                }
            }
        }

        // Calculate new LexoRank position
        string? prevPos = null;
        if (request.PreviousIssueId.HasValue)
        {
            var prevIssue = await _context.Issues
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == request.PreviousIssueId.Value, cancellationToken);
            prevPos = prevIssue?.Position;
        }

        string? nextPos = null;
        if (request.NextIssueId.HasValue)
        {
            var nextIssue = await _context.Issues
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == request.NextIssueId.Value, cancellationToken);
            nextPos = nextIssue?.Position;
        }

        issue.Position = LexoRank.Between(prevPos, nextPos);
        issue.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new IssueDto
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
            UpdatedAt = issue.UpdatedAt
        };
    }
}
