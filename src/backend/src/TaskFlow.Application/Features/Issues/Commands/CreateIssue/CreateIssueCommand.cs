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

namespace TaskFlow.Application.Features.Issues.Commands.CreateIssue;

public record CreateIssueCommand : IRequest<IssueDto>
{
    public Guid ProjectId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Guid TypeId { get; init; }
    public Guid? StatusId { get; init; }
    public IssuePriority Priority { get; init; } = IssuePriority.Medium;
    public Guid? AssigneeId { get; init; }
    public Guid? SprintId { get; init; }
    public Guid? ParentId { get; init; }
    public decimal? StoryPoints { get; init; }
    public DateOnly? DueDate { get; init; }
    public List<Guid>? LabelIds { get; init; }
}

public class CreateIssueCommandValidator : AbstractValidator<CreateIssueCommand>
{
    public CreateIssueCommandValidator()
    {
        RuleFor(v => v.ProjectId).NotEmpty();
        RuleFor(v => v.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(255).WithMessage("Title must not exceed 255 characters.");

        RuleFor(v => v.TypeId).NotEmpty();
        RuleFor(v => v.StoryPoints)
            .GreaterThanOrEqualTo(0)
            .When(v => v.StoryPoints.HasValue)
            .WithMessage("Story points must be non-negative.");
    }
}

public class CreateIssueCommandHandler : IRequestHandler<CreateIssueCommand, IssueDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IIssueKeyGenerator _keyGenerator;
    private readonly IProjectAuthorizationService _projectAuthService;

    public CreateIssueCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IIssueKeyGenerator keyGenerator,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _keyGenerator = keyGenerator;
        _projectAuthService = projectAuthService;
    }

    public async Task<IssueDto> Handle(CreateIssueCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        // Anti-IDOR: Verify caller has Member/Admin/Owner role in the project
        await _projectAuthService.EnsureRoleAsync(
            request.ProjectId,
            new[] { ProjectRole.Owner, ProjectRole.Admin, ProjectRole.Member },
            cancellationToken);

        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId && p.DeletedAt == null, cancellationToken);

        if (project == null)
        {
            throw new NotFoundException("Project", request.ProjectId);
        }

        // Verify type exists in project
        var issueType = await _context.IssueTypes
            .FirstOrDefaultAsync(t => t.Id == request.TypeId && t.ProjectId == request.ProjectId, cancellationToken);

        if (issueType == null)
        {
            throw new NotFoundException("IssueType", request.TypeId);
        }

        // Determine Status
        IssueStatus? status;
        if (request.StatusId.HasValue)
        {
            status = await _context.IssueStatuses
                .FirstOrDefaultAsync(s => s.Id == request.StatusId.Value && s.ProjectId == request.ProjectId, cancellationToken);

            if (status == null)
            {
                throw new NotFoundException("IssueStatus", request.StatusId.Value);
            }
        }
        else
        {
            status = await _context.IssueStatuses
                .Where(s => s.ProjectId == request.ProjectId)
                .OrderBy(s => s.OrderIndex)
                .FirstOrDefaultAsync(cancellationToken);

            if (status == null)
            {
                throw new ConflictException("Project has no configured issue statuses.");
            }
        }

        // Determine Sprint if provided
        Sprint? sprint = null;
        if (request.SprintId.HasValue)
        {
            sprint = await _context.Sprints
                .FirstOrDefaultAsync(s => s.Id == request.SprintId.Value && s.ProjectId == request.ProjectId && s.DeletedAt == null, cancellationToken);

            if (sprint == null)
            {
                throw new NotFoundException("Sprint", request.SprintId.Value);
            }
        }

        // Validate Hierarchy: Epic > Story/Task/Bug > Sub-task
        if (issueType.Category == IssueTypeCategory.Epic && request.ParentId.HasValue)
        {
            throw new ConflictException("An Epic cannot have a parent issue.");
        }

        if (request.ParentId.HasValue)
        {
            var parent = await _context.Issues
                .Include(p => p.Type)
                .FirstOrDefaultAsync(p => p.Id == request.ParentId.Value && p.ProjectId == request.ProjectId && p.DeletedAt == null, cancellationToken);

            if (parent == null)
            {
                throw new NotFoundException("Parent Issue", request.ParentId.Value);
            }

            // A Subtask cannot be the parent of another issue (max 2 levels)
            if (parent.Type.Category == IssueTypeCategory.Subtask || parent.Type.IsSubtask)
            {
                throw new ConflictException("A Sub-task cannot be the parent of another issue.");
            }

            // Subtask can belong to Story, Task, Bug
            if (issueType.Category == IssueTypeCategory.Subtask && parent.Type.Category == IssueTypeCategory.Epic)
            {
                throw new ConflictException("A Sub-task must have a Story, Task, or Bug as parent, not an Epic.");
            }
        }

        // Calculate Position (end of status column)
        var lastIssue = await _context.Issues
            .Where(i => i.ProjectId == request.ProjectId && i.StatusId == status.Id && i.DeletedAt == null)
            .OrderByDescending(i => i.Position)
            .FirstOrDefaultAsync(cancellationToken);

        var position = LexoRank.Between(lastIssue?.Position, null);

        // Atomic generation of key (e.g. TF-1)
        var (issueNumber, issueKey) = await _keyGenerator.GenerateNextIssueKeyAsync(project.Id, cancellationToken);

        var issue = new Issue
        {
            Id = Guid.NewGuid(),
            ProjectId = project.Id,
            IssueNumber = issueNumber,
            IssueKey = issueKey,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            TypeId = issueType.Id,
            StatusId = status.Id,
            Priority = request.Priority,
            AssigneeId = request.AssigneeId,
            ReporterId = currentUserId.Value,
            SprintId = sprint?.Id,
            ParentId = request.ParentId,
            StoryPoints = request.StoryPoints,
            Position = position,
            DueDate = request.DueDate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Add Labels
        var assignedLabels = new List<Label>();
        if (request.LabelIds != null && request.LabelIds.Any())
        {
            assignedLabels = await _context.Labels
                .Where(l => request.LabelIds.Contains(l.Id) && l.ProjectId == project.Id)
                .ToListAsync(cancellationToken);

            foreach (var label in assignedLabels)
            {
                issue.IssueLabels.Add(new IssueLabel
                {
                    IssueId = issue.Id,
                    LabelId = label.Id
                });
            }
        }

        // Add Activity Log
        var activityLog = new ActivityLog
        {
            Id = Guid.NewGuid(),
            IssueId = issue.Id,
            UserId = currentUserId.Value,
            ActivityType = ActivityType.Created,
            FieldName = null,
            OldValue = null,
            NewValue = issue.Title,
            CreatedAt = DateTime.UtcNow
        };

        _context.Issues.Add(issue);
        _context.ActivityLogs.Add(activityLog);

        // Notify Assignee if assigned to someone else
        if (issue.AssigneeId.HasValue && issue.AssigneeId.Value != currentUserId.Value)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                RecipientId = issue.AssigneeId.Value,
                SenderId = currentUserId.Value,
                Type = NotificationType.IssueAssigned,
                Title = "Assigned to Issue",
                Message = $"You were assigned to {issue.IssueKey}: {issue.Title}",
                LinkUrl = $"/issues/{issue.IssueKey}",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Fetch Reporter & Assignee Profiles
        var reporter = await _context.Profiles.FirstOrDefaultAsync(p => p.Id == issue.ReporterId, cancellationToken);
        Profile? assignee = null;
        if (issue.AssigneeId.HasValue)
        {
            assignee = await _context.Profiles.FirstOrDefaultAsync(p => p.Id == issue.AssigneeId.Value, cancellationToken);
        }

        return new IssueDto
        {
            Id = issue.Id,
            ProjectId = issue.ProjectId,
            IssueNumber = issue.IssueNumber,
            IssueKey = issue.IssueKey,
            Title = issue.Title,
            Description = issue.Description,
            TypeId = issue.TypeId,
            TypeName = issueType.Name,
            TypeIconName = issueType.IconName,
            TypeCategory = issueType.Category,
            StatusId = issue.StatusId,
            StatusName = status.Name,
            StatusColorHex = status.ColorHex,
            IsCompletedStatus = status.IsCompletedStatus,
            Priority = issue.Priority,
            AssigneeId = issue.AssigneeId,
            AssigneeName = assignee?.FullName,
            AssigneeAvatarUrl = assignee?.AvatarUrl,
            ReporterId = issue.ReporterId,
            ReporterName = reporter?.FullName ?? "Unknown",
            ReporterAvatarUrl = reporter?.AvatarUrl,
            SprintId = issue.SprintId,
            SprintName = sprint?.Name,
            ParentId = issue.ParentId,
            StoryPoints = issue.StoryPoints,
            Position = issue.Position,
            DueDate = issue.DueDate,
            RowVersion = issue.RowVersion,
            Labels = assignedLabels.Select(l => new LabelDto
            {
                Id = l.Id,
                ProjectId = l.ProjectId,
                Name = l.Name,
                ColorHex = l.ColorHex
            }).ToList(),
            CommentCount = 0,
            AttachmentCount = 0,
            SubtaskCount = 0,
            CreatedAt = issue.CreatedAt,
            UpdatedAt = issue.UpdatedAt
        };
    }
}
