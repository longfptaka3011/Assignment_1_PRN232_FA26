using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;

namespace TaskFlow.Application.Features.SavedFilters.Commands.DeleteSavedFilter;

public record DeleteSavedFilterCommand(Guid Id) : IRequest<bool>;

public class DeleteSavedFilterCommandHandler : IRequestHandler<DeleteSavedFilterCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteSavedFilterCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(DeleteSavedFilterCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var filter = await _context.SavedFilters
            .FirstOrDefaultAsync(f => f.Id == request.Id && f.UserId == currentUserId.Value && f.DeletedAt == null, cancellationToken);

        if (filter == null)
        {
            throw new NotFoundException("SavedFilter", request.Id);
        }

        _context.SavedFilters.Remove(filter);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
