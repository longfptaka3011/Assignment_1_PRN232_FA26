using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.WorkLogs.DTOs;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.WorkLogs.Commands.CreateWorkLog;

public record CreateWorkLogCommand : IRequest<WorkLogDto>
{
    public Guid IssueId { get; init; }
    public int TimeSpentMinutes { get; init; }
    public DateTime StartedAt { get; init; } = DateTime.UtcNow;
    public string? Description { get; init; }
}

public class CreateWorkLogCommandValidator : AbstractValidator<CreateWorkLogCommand>
{
    public CreateWorkLogCommandValidator()
    {
        RuleFor(v => v.IssueId).NotEmpty();
        RuleFor(v => v.TimeSpentMinutes).GreaterThan(0).WithMessage("Time spent must be greater than 0 minutes.");
        RuleFor(v => v.StartedAt).NotEmpty().WithMessage("Start date/time is required.");
    }
}

public class CreateWorkLogCommandHandler : IRequestHandler<CreateWorkLogCommand, WorkLogDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IProjectAuthorizationService _projectAuthService;

    public CreateWorkLogCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _projectAuthService = projectAuthService;
    }

    public async Task<WorkLogDto> Handle(CreateWorkLogCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var issue = await _context.Issues
            .FirstOrDefaultAsync(i => i.Id == request.IssueId && i.DeletedAt == null, cancellationToken);

        if (issue == null)
        {
            throw new NotFoundException("Issue", request.IssueId);
        }

        await _projectAuthService.EnsureRoleAsync(
            issue.ProjectId,
            new[] { ProjectRole.Owner, ProjectRole.Admin, ProjectRole.Member },
            cancellationToken);

        var user = await _context.Profiles
            .FirstOrDefaultAsync(p => p.Id == currentUserId.Value, cancellationToken);

        var workLog = new WorkLog
        {
            Id = Guid.NewGuid(),
            IssueId = request.IssueId,
            UserId = currentUserId.Value,
            TimeSpentMinutes = request.TimeSpentMinutes,
            StartedAt = request.StartedAt,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.WorkLogs.Add(workLog);

        _context.ActivityLogs.Add(new ActivityLog
        {
            Id = Guid.NewGuid(),
            IssueId = issue.Id,
            UserId = currentUserId.Value,
            ActivityType = ActivityType.CommentAdded,
            FieldName = "WorkLog",
            NewValue = $"Logged {request.TimeSpentMinutes}m: {request.Description ?? "Work completed"}",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new WorkLogDto
        {
            Id = workLog.Id,
            IssueId = workLog.IssueId,
            UserId = workLog.UserId,
            UserName = user?.FullName ?? "Unknown User",
            UserAvatarUrl = user?.AvatarUrl,
            TimeSpentMinutes = workLog.TimeSpentMinutes,
            StartedAt = workLog.StartedAt,
            Description = workLog.Description,
            CreatedAt = workLog.CreatedAt
        };
    }
}
