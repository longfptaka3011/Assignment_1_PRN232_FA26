using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Projects.DTOs;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Projects.Commands.AddProjectMember;

public record AddProjectMemberCommand : IRequest<ProjectMemberDto>
{
    public Guid ProjectId { get; init; }
    public string Email { get; init; } = string.Empty;
    public ProjectRole Role { get; init; } = ProjectRole.Member;
}

public class AddProjectMemberCommandValidator : AbstractValidator<AddProjectMemberCommand>
{
    public AddProjectMemberCommandValidator()
    {
        RuleFor(v => v.ProjectId).NotEmpty();
        RuleFor(v => v.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.");
    }
}

public class AddProjectMemberCommandHandler : IRequestHandler<AddProjectMemberCommand, ProjectMemberDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AddProjectMemberCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectMemberDto> Handle(AddProjectMemberCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var project = await _context.Projects
            .Include(p => p.Members)
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId && p.DeletedAt == null, cancellationToken);

        if (project == null)
        {
            throw new NotFoundException("Project", request.ProjectId);
        }

        // Verify caller is Owner or Admin
        var callerMember = project.Members.FirstOrDefault(m => m.UserId == currentUserId.Value);
        var isOwnerOrAdmin = callerMember?.Role == ProjectRole.Owner || callerMember?.Role == ProjectRole.Admin || project.LeadId == currentUserId.Value;
        if (!isOwnerOrAdmin)
        {
            throw new ForbiddenAccessException("Only project owners and admins can add new members.");
        }

        var email = request.Email.Trim().ToLowerInvariant();

        // Find or create profile for this user
        var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.Email.ToLower() == email, cancellationToken);
        if (profile == null)
        {
            profile = new Profile
            {
                Id = Guid.NewGuid(),
                Email = email,
                FullName = email.Split('@')[0],
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Profiles.Add(profile);
        }

        // Check if user is already a member
        var existingMember = project.Members.FirstOrDefault(m => m.UserId == profile.Id);
        if (existingMember != null)
        {
            throw new ConflictException("User is already a member of this project.");
        }

        var member = new ProjectMember
        {
            Id = Guid.NewGuid(),
            ProjectId = project.Id,
            UserId = profile.Id,
            Role = request.Role,
            JoinedAt = DateTime.UtcNow
        };

        _context.ProjectMembers.Add(member);

        // Send notification to the newly added member
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            RecipientId = profile.Id,
            SenderId = currentUserId.Value,
            Type = NotificationType.ProjectInvited,
            Title = "Added to Project",
            Message = $"You have been added to project '{project.Name}' as {request.Role}.",
            LinkUrl = $"/projects/{project.Id}",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.Notifications.Add(notification);

        await _context.SaveChangesAsync(cancellationToken);

        return new ProjectMemberDto
        {
            Id = member.Id,
            ProjectId = member.ProjectId,
            UserId = profile.Id,
            Email = profile.Email,
            FullName = profile.FullName,
            AvatarUrl = profile.AvatarUrl,
            Role = member.Role,
            JoinedAt = member.JoinedAt
        };
    }
}
