using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Projects.DTOs;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Projects.Commands.UpdateProjectMemberRole;

public record UpdateProjectMemberRoleCommand : IRequest<ProjectMemberDto>
{
    public Guid ProjectId { get; init; }
    public Guid UserId { get; init; }
    public ProjectRole Role { get; init; }
}

public class UpdateProjectMemberRoleCommandHandler : IRequestHandler<UpdateProjectMemberRoleCommand, ProjectMemberDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateProjectMemberRoleCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectMemberDto> Handle(UpdateProjectMemberRoleCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var project = await _context.Projects
            .Include(p => p.Members)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId && p.DeletedAt == null, cancellationToken);

        if (project == null)
        {
            throw new NotFoundException("Project", request.ProjectId);
        }

        var callerMember = project.Members.FirstOrDefault(m => m.UserId == currentUserId.Value);
        var isOwnerOrAdmin = callerMember?.Role == ProjectRole.Owner || callerMember?.Role == ProjectRole.Admin || project.LeadId == currentUserId.Value;
        if (!isOwnerOrAdmin)
        {
            throw new ForbiddenAccessException("Only project owners and admins can update member roles.");
        }

        var targetMember = project.Members.FirstOrDefault(m => m.UserId == request.UserId);
        if (targetMember == null)
        {
            throw new NotFoundException("ProjectMember", request.UserId);
        }

        // Project lead must remain an Owner
        if (project.LeadId == request.UserId && request.Role != ProjectRole.Owner)
        {
            throw new ConflictException("The project lead cannot be demoted from Owner.");
        }

        targetMember.Role = request.Role;
        await _context.SaveChangesAsync(cancellationToken);

        return new ProjectMemberDto
        {
            Id = targetMember.Id,
            ProjectId = targetMember.ProjectId,
            UserId = targetMember.UserId,
            Email = targetMember.User.Email,
            FullName = targetMember.User.FullName,
            AvatarUrl = targetMember.User.AvatarUrl,
            Role = targetMember.Role,
            JoinedAt = targetMember.JoinedAt
        };
    }
}
