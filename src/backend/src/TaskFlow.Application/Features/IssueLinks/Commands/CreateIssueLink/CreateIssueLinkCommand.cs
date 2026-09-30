using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.IssueLinks.DTOs;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.IssueLinks.Commands.CreateIssueLink;

public record CreateIssueLinkCommand : IRequest<IssueLinkDto>
{
    public Guid SourceIssueId { get; init; }
    public Guid TargetIssueId { get; init; }
    public IssueLinkType LinkType { get; init; } = IssueLinkType.RelatesTo;
}

public class CreateIssueLinkCommandValidator : AbstractValidator<CreateIssueLinkCommand>
{
    public CreateIssueLinkCommandValidator()
    {
        RuleFor(v => v.SourceIssueId).NotEmpty();
        RuleFor(v => v.TargetIssueId).NotEmpty();
        RuleFor(v => v)
            .Must(v => v.SourceIssueId != v.TargetIssueId)
            .WithMessage("An issue cannot be linked to itself.");
    }
}

public class CreateIssueLinkCommandHandler : IRequestHandler<CreateIssueLinkCommand, IssueLinkDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IProjectAuthorizationService _projectAuthService;

    public CreateIssueLinkCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _projectAuthService = projectAuthService;
    }

    public async Task<IssueLinkDto> Handle(CreateIssueLinkCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        if (request.SourceIssueId == request.TargetIssueId)
        {
            throw new ConflictException("An issue cannot be linked to itself.");
        }

        var sourceIssue = await _context.Issues
            .Include(i => i.Status)
            .FirstOrDefaultAsync(i => i.Id == request.SourceIssueId && i.DeletedAt == null, cancellationToken);

        if (sourceIssue == null)
        {
            throw new NotFoundException("Source Issue", request.SourceIssueId);
        }

        var targetIssue = await _context.Issues
            .Include(i => i.Status)
            .FirstOrDefaultAsync(i => i.Id == request.TargetIssueId && i.DeletedAt == null, cancellationToken);

        if (targetIssue == null)
        {
            throw new NotFoundException("Target Issue", request.TargetIssueId);
        }

        // Anti-IDOR: Verify caller has Member/Admin/Owner role in source project
        await _projectAuthService.EnsureRoleAsync(
            sourceIssue.ProjectId,
            new[] { ProjectRole.Owner, ProjectRole.Admin, ProjectRole.Member },
            cancellationToken);

        // Also verify access to target project if across projects
        if (targetIssue.ProjectId != sourceIssue.ProjectId)
        {
            await _projectAuthService.EnsureMemberAsync(targetIssue.ProjectId, cancellationToken);
        }

        // Check for duplicate link
        var exists = await _context.IssueLinks
            .AnyAsync(l => 
                (l.SourceIssueId == request.SourceIssueId && l.TargetIssueId == request.TargetIssueId && l.LinkType == request.LinkType) ||
                (l.SourceIssueId == request.TargetIssueId && l.TargetIssueId == request.SourceIssueId && l.LinkType == request.LinkType),
                cancellationToken);

        if (exists)
        {
            throw new ConflictException("These issues are already linked with this relationship.");
        }

        var link = new IssueLink
        {
            Id = Guid.NewGuid(),
            SourceIssueId = sourceIssue.Id,
            TargetIssueId = targetIssue.Id,
            LinkType = request.LinkType,
            CreatedBy = currentUserId.Value,
            CreatedAt = DateTime.UtcNow
        };

        _context.IssueLinks.Add(link);

        // Activity log for source issue
        _context.ActivityLogs.Add(new ActivityLog
        {
            Id = Guid.NewGuid(),
            IssueId = sourceIssue.Id,
            UserId = currentUserId.Value,
            ActivityType = ActivityType.Updated,
            FieldName = "Link",
            OldValue = null,
            NewValue = $"{request.LinkType} {targetIssue.IssueKey}",
            CreatedAt = DateTime.UtcNow
        });

        // Activity log for target issue
        _context.ActivityLogs.Add(new ActivityLog
        {
            Id = Guid.NewGuid(),
            IssueId = targetIssue.Id,
            UserId = currentUserId.Value,
            ActivityType = ActivityType.Updated,
            FieldName = "Link",
            OldValue = null,
            NewValue = $"Linked from {sourceIssue.IssueKey}",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);

        var creator = await _context.Profiles
            .FirstOrDefaultAsync(p => p.Id == currentUserId.Value, cancellationToken);

        return new IssueLinkDto
        {
            Id = link.Id,
            SourceIssueId = sourceIssue.Id,
            SourceIssueKey = sourceIssue.IssueKey,
            SourceTitle = sourceIssue.Title,
            TargetIssueId = targetIssue.Id,
            TargetIssueKey = targetIssue.IssueKey,
            TargetTitle = targetIssue.Title,
            TargetStatusName = targetIssue.Status?.Name ?? "Unknown",
            TargetStatusColorHex = targetIssue.Status?.ColorHex ?? "#6B7280",
            LinkType = link.LinkType,
            RelationshipText = link.LinkType.ToString().ToLower(),
            CreatedBy = link.CreatedBy,
            CreatorName = creator?.FullName ?? "Unknown",
            CreatedAt = link.CreatedAt
        };
    }
}
