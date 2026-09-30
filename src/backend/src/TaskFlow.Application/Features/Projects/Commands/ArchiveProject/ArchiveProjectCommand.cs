using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Projects.Commands.ArchiveProject;

public record ArchiveProjectCommand(Guid Id, bool IsArchived) : IRequest<bool>;

public class ArchiveProjectCommandHandler : IRequestHandler<ArchiveProjectCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ArchiveProjectCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(ArchiveProjectCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var project = await _context.Projects
            .Include(p => p.Members)
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.DeletedAt == null, cancellationToken);

        if (project == null)
        {
            throw new NotFoundException("Project", request.Id);
        }

        var callerMember = project.Members.FirstOrDefault(m => m.UserId == userId.Value);
        var isOwner = callerMember?.Role == ProjectRole.Owner || project.LeadId == userId.Value;
        if (!isOwner)
        {
            throw new ForbiddenAccessException("Only project owners can archive or unarchive the project.");
        }

        project.IsArchived = request.IsArchived;
        project.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
