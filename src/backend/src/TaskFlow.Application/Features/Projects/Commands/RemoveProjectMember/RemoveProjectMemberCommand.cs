using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Projects.Commands.RemoveProjectMember;

public record RemoveProjectMemberCommand(Guid ProjectId, Guid UserId) : IRequest<bool>;

public class RemoveProjectMemberCommandHandler : IRequestHandler<RemoveProjectMemberCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public RemoveProjectMemberCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(RemoveProjectMemberCommand request, CancellationToken cancellationToken)
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

        // Cannot remove the lead
        if (project.LeadId == request.UserId)
        {
            throw new ConflictException("The project lead cannot be removed from the project.");
        }

        // Allow self-removal or Owner/Admin removal
        var callerMember = project.Members.FirstOrDefault(m => m.UserId == currentUserId.Value);
        var isSelf = currentUserId.Value == request.UserId;
        var isOwnerOrAdmin = callerMember?.Role == ProjectRole.Owner || callerMember?.Role == ProjectRole.Admin || project.LeadId == currentUserId.Value;

        if (!isSelf && !isOwnerOrAdmin)
        {
            throw new ForbiddenAccessException("You do not have permission to remove this member.");
        }

        var targetMember = project.Members.FirstOrDefault(m => m.UserId == request.UserId);
        if (targetMember == null)
        {
            throw new NotFoundException("ProjectMember", request.UserId);
        }

        _context.ProjectMembers.Remove(targetMember);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
