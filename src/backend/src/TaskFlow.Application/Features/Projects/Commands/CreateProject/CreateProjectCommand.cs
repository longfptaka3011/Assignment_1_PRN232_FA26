using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.IssueStatuses.DTOs;
using TaskFlow.Application.Features.IssueTypes.DTOs;
using TaskFlow.Application.Features.Labels.DTOs;
using TaskFlow.Application.Features.Projects.DTOs;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Projects.Commands.CreateProject;

public record CreateProjectCommand : IRequest<ProjectDetailDto>
{
    public string Name { get; init; } = string.Empty;
    public string Key { get; init; } = string.Empty;
    public string? Description { get; init; }
}

public class CreateProjectCommandValidator : AbstractValidator<CreateProjectCommand>
{
    public CreateProjectCommandValidator()
    {
        RuleFor(v => v.Name)
            .NotEmpty().WithMessage("Project name is required.")
            .MaximumLength(150).WithMessage("Project name must not exceed 150 characters.");

        RuleFor(v => v.Key)
            .NotEmpty().WithMessage("Project key is required.")
            .Matches(@"^[A-Z][A-Z0-9]{1,9}$")
            .WithMessage("Project key must start with an uppercase letter, contain only uppercase alphanumeric characters, and be 2 to 10 characters long.");

        RuleFor(v => v.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters.");
    }
}

public class CreateProjectCommandHandler : IRequestHandler<CreateProjectCommand, ProjectDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateProjectCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectDetailDto> Handle(CreateProjectCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var key = request.Key.Trim().ToUpperInvariant();

        // Check if project key already exists
        var keyExists = await _context.Projects
            .AnyAsync(p => p.Key == key && p.DeletedAt == null, cancellationToken);

        if (keyExists)
        {
            throw new ConflictException($"Project with key '{key}' already exists.");
        }

        // Ensure user profile exists
        var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.Id == userId.Value, cancellationToken);
        if (profile == null)
        {
            var email = _currentUserService.Email ?? $"{userId.Value}@user.taskflow";
            profile = new Profile
            {
                Id = userId.Value,
                Email = email,
                FullName = email.Split('@')[0],
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Profiles.Add(profile);
        }

        var project = new Project
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Key = key,
            Description = request.Description?.Trim(),
            LeadId = userId.Value,
            IssueCounter = 0,
            IsArchived = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Add creator as Project Owner
        var member = new ProjectMember
        {
            Id = Guid.NewGuid(),
            ProjectId = project.Id,
            UserId = userId.Value,
            Role = ProjectRole.Owner,
            JoinedAt = DateTime.UtcNow
        };

        // Default Issue Types
        var issueTypes = new List<IssueType>
        {
            new() { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "Epic", IconName = "bookmark", Category = IssueTypeCategory.Epic, OrderIndex = 0, IsSubtask = false },
            new() { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "Story", IconName = "check-circle", Category = IssueTypeCategory.Story, OrderIndex = 1, IsSubtask = false },
            new() { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "Task", IconName = "clipboard-document-list", Category = IssueTypeCategory.Task, OrderIndex = 2, IsSubtask = false },
            new() { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "Bug", IconName = "bug-ant", Category = IssueTypeCategory.Bug, OrderIndex = 3, IsSubtask = false },
            new() { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "Sub-task", IconName = "bars-3-bottom-left", Category = IssueTypeCategory.Subtask, OrderIndex = 4, IsSubtask = true }
        };

        // Default Issue Statuses
        var issueStatuses = new List<IssueStatus>
        {
            new() { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "Backlog", ColorHex = "#6B7280", OrderIndex = 0, IsCompletedStatus = false },
            new() { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "To Do", ColorHex = "#3B82F6", OrderIndex = 1, IsCompletedStatus = false },
            new() { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "In Progress", ColorHex = "#F59E0B", OrderIndex = 2, IsCompletedStatus = false },
            new() { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "In Review", ColorHex = "#8B5CF6", OrderIndex = 3, IsCompletedStatus = false },
            new() { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "Done", ColorHex = "#10B981", OrderIndex = 4, IsCompletedStatus = true }
        };

        // Default Labels
        var labels = new List<Label>
        {
            new() { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "Frontend", ColorHex = "#3B82F6" },
            new() { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "Backend", ColorHex = "#10B981" },
            new() { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "UI/UX", ColorHex = "#EC4899" },
            new() { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "Bug", ColorHex = "#EF4444" }
        };

        _context.Projects.Add(project);
        _context.ProjectMembers.Add(member);
        _context.IssueTypes.AddRange(issueTypes);
        _context.IssueStatuses.AddRange(issueStatuses);
        _context.Labels.AddRange(labels);

        await _context.SaveChangesAsync(cancellationToken);

        return new ProjectDetailDto
        {
            Id = project.Id,
            Name = project.Name,
            Key = project.Key,
            Description = project.Description,
            LeadId = project.LeadId,
            LeadName = profile.FullName,
            LeadAvatarUrl = profile.AvatarUrl,
            IssueCounter = project.IssueCounter,
            IsArchived = project.IsArchived,
            MemberCount = 1,
            IssueCount = 0,
            CreatedAt = project.CreatedAt,
            Members = new List<ProjectMemberDto>
            {
                new()
                {
                    Id = member.Id,
                    ProjectId = project.Id,
                    UserId = profile.Id,
                    Email = profile.Email,
                    FullName = profile.FullName,
                    AvatarUrl = profile.AvatarUrl,
                    Role = member.Role,
                    JoinedAt = member.JoinedAt
                }
            },
            IssueTypes = issueTypes.Select(t => new IssueTypeDto
            {
                Id = t.Id,
                ProjectId = t.ProjectId,
                Name = t.Name,
                IconName = t.IconName,
                Category = t.Category,
                OrderIndex = t.OrderIndex,
                IsSubtask = t.IsSubtask
            }).ToList(),
            IssueStatuses = issueStatuses.Select(s => new IssueStatusDto
            {
                Id = s.Id,
                ProjectId = s.ProjectId,
                Name = s.Name,
                ColorHex = s.ColorHex,
                OrderIndex = s.OrderIndex,
                IsCompletedStatus = s.IsCompletedStatus
            }).ToList(),
            Labels = labels.Select(l => new LabelDto
            {
                Id = l.Id,
                ProjectId = l.ProjectId,
                Name = l.Name,
                ColorHex = l.ColorHex
            }).ToList()
        };
    }
}
