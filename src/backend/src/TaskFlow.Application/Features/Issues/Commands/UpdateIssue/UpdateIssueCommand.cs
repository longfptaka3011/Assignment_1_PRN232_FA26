using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Issues.DTOs;
using TaskFlow.Application.Features.Labels.DTOs;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Issues.Commands.UpdateIssue;

public record UpdateIssueCommand : IRequest<IssueDto>
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Guid TypeId { get; init; }
    public Guid StatusId { get; init; }
    public IssuePriority Priority { get; init; }
    public Guid? AssigneeId { get; init; }
    public Guid? SprintId { get; init; }
    public decimal? StoryPoints { get; init; }
    public DateOnly? DueDate { get; init; }
    public List<Guid>? LabelIds { get; init; }
    public uint RowVersion { get; init; }
}

public class UpdateIssueCommandValidator : AbstractValidator<UpdateIssueCommand>
{
    public UpdateIssueCommandValidator()
    {
        RuleFor(v => v.Id).NotEmpty();
        RuleFor(v => v.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(255).WithMessage("Title must not exceed 255 characters.");

        RuleFor(v => v.TypeId).NotEmpty();
        RuleFor(v => v.StatusId).NotEmpty();
        RuleFor(v => v.StoryPoints)
            .GreaterThanOrEqualTo(0)
            .When(v => v.StoryPoints.HasValue)
            .WithMessage("Story points must be non-negative.");
    }
}

public class UpdateIssueCommandHandler : IRequestHandler<UpdateIssueCommand, IssueDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IProjectAuthorizationService _projectAuthService;

    public UpdateIssueCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _projectAuthService = projectAuthService;
    }

    public async Task<IssueDto> Handle(UpdateIssueCommand request, CancellationToken cancellationToken)
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
            .FirstOrDefaultAsync(i => i.Id == request.Id && i.DeletedAt == null, cancellationToken);

        if (issue == null)
        {
            throw new NotFoundException("Issue", request.Id);
        }

        // Anti-IDOR: Check caller has permission on this project
        await _projectAuthService.EnsureRoleAsync(
            issue.ProjectId,
            new[] { ProjectRole.Owner, ProjectRole.Admin, ProjectRole.Member },
            cancellationToken);

        // Concurrency check
        if (request.RowVersion > 0 && issue.RowVersion != request.RowVersion)
        {
            throw new ConflictException("The issue was modified by another user. Please refresh and try again.");
        }

        var oldAssigneeId = issue.AssigneeId;
        var oldStatusId = issue.StatusId;
        var oldPriority = issue.Priority;
        var oldTitle = issue.Title;

        // Check Type
        if (issue.TypeId != request.TypeId)
        {
            var newType = await _context.IssueTypes
                .FirstOrDefaultAsync(t => t.Id == request.TypeId && t.ProjectId == issue.ProjectId, cancellationToken);
            if (newType == null) throw new NotFoundException("IssueType", request.TypeId);

            _context.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                IssueId = issue.Id,
                UserId = currentUserId.Value,
                ActivityType = ActivityType.Updated,
                FieldName = "Type",
                OldValue = issue.Type.Name,
                NewValue = newType.Name,
                CreatedAt = DateTime.UtcNow
            });
            issue.TypeId = newType.Id;
            issue.Type = newType;
        }

        // Check Status
        if (issue.StatusId != request.StatusId)
        {
            var newStatus = await _context.IssueStatuses
                .FirstOrDefaultAsync(s => s.Id == request.StatusId && s.ProjectId == issue.ProjectId, cancellationToken);
            if (newStatus == null) throw new NotFoundException("IssueStatus", request.StatusId);

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

        // Check Priority
        if (issue.Priority != request.Priority)
        {
            _context.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                IssueId = issue.Id,
                UserId = currentUserId.Value,
                ActivityType = ActivityType.PriorityChanged,
                FieldName = "Priority",
                OldValue = issue.Priority.ToString(),
                NewValue = request.Priority.ToString(),
                CreatedAt = DateTime.UtcNow
            });
            issue.Priority = request.Priority;
        }

        // Check Assignee
        if (issue.AssigneeId != request.AssigneeId)
        {
            Profile? newAssignee = null;
            if (request.AssigneeId.HasValue)
            {
                newAssignee = await _context.Profiles
                    .FirstOrDefaultAsync(p => p.Id == request.AssigneeId.Value, cancellationToken);
                if (newAssignee == null) throw new NotFoundException("User", request.AssigneeId.Value);
            }

            _context.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                IssueId = issue.Id,
                UserId = currentUserId.Value,
                ActivityType = ActivityType.Assigned,
                FieldName = "Assignee",
                OldValue = issue.Assignee?.FullName,
                NewValue = newAssignee?.FullName,
                CreatedAt = DateTime.UtcNow
            });

            issue.AssigneeId = newAssignee?.Id;
            issue.Assignee = newAssignee;

            if (newAssignee != null && newAssignee.Id != currentUserId.Value)
            {
                _context.Notifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    RecipientId = newAssignee.Id,
                    SenderId = currentUserId.Value,
                    Type = NotificationType.IssueAssigned,
                    Title = "Assigned to Issue",
                    Message = $"You were assigned to {issue.IssueKey}: {issue.Title}",
                    LinkUrl = $"/issues/{issue.IssueKey}",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        // Check Sprint
        if (issue.SprintId != request.SprintId)
        {
            Sprint? newSprint = null;
            if (request.SprintId.HasValue)
            {
                newSprint = await _context.Sprints
                    .FirstOrDefaultAsync(s => s.Id == request.SprintId.Value && s.ProjectId == issue.ProjectId && s.DeletedAt == null, cancellationToken);
                if (newSprint == null) throw new NotFoundException("Sprint", request.SprintId.Value);
            }

            _context.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                IssueId = issue.Id,
                UserId = currentUserId.Value,
                ActivityType = ActivityType.SprintChanged,
                FieldName = "Sprint",
                OldValue = issue.Sprint?.Name,
                NewValue = newSprint?.Name,
                CreatedAt = DateTime.UtcNow
            });

            issue.SprintId = newSprint?.Id;
            issue.Sprint = newSprint;
        }

        // Title & Description
        if (issue.Title != request.Title.Trim())
        {
            _context.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                IssueId = issue.Id,
                UserId = currentUserId.Value,
                ActivityType = ActivityType.Updated,
                FieldName = "Title",
                OldValue = issue.Title,
                NewValue = request.Title.Trim(),
                CreatedAt = DateTime.UtcNow
            });
            issue.Title = request.Title.Trim();
        }

        issue.Description = request.Description?.Trim();
        issue.StoryPoints = request.StoryPoints;
        issue.DueDate = request.DueDate;
        issue.UpdatedAt = DateTime.UtcNow;

        // Update Labels if specified
        if (request.LabelIds != null)
        {
            // Remove unselected labels
            var toRemove = issue.IssueLabels.Where(il => !request.LabelIds.Contains(il.LabelId)).ToList();
            foreach (var r in toRemove)
            {
                _context.IssueLabels.Remove(r);
            }

            // Add newly selected labels
            var currentLabelIds = issue.IssueLabels.Select(il => il.LabelId).ToHashSet();
            var toAdd = request.LabelIds.Where(id => !currentLabelIds.Contains(id)).ToList();
            foreach (var labelId in toAdd)
            {
                _context.IssueLabels.Add(new IssueLabel
                {
                    IssueId = issue.Id,
                    LabelId = labelId
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Reload labels
        var updatedLabels = await _context.IssueLabels
            .Where(il => il.IssueId == issue.Id)
            .Include(il => il.Label)
            .Select(il => new LabelDto
            {
                Id = il.Label.Id,
                ProjectId = il.Label.ProjectId,
                Name = il.Label.Name,
                ColorHex = il.Label.ColorHex
            })
            .ToListAsync(cancellationToken);

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
            Labels = updatedLabels,
            CommentCount = issue.Comments.Count,
            AttachmentCount = issue.Attachments.Count,
            SubtaskCount = issue.Subtasks.Count,
            CreatedAt = issue.CreatedAt,
            UpdatedAt = issue.UpdatedAt
        };
    }
}
