using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.SavedFilters.DTOs;

namespace TaskFlow.Application.Features.SavedFilters.Queries.GetSavedFilters;

public record GetSavedFiltersQuery(Guid? ProjectId = null) : IRequest<List<SavedFilterDto>>;

public class GetSavedFiltersQueryHandler : IRequestHandler<GetSavedFiltersQuery, List<SavedFilterDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetSavedFiltersQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<SavedFilterDto>> Handle(GetSavedFiltersQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var query = _context.SavedFilters
            .AsNoTracking()
            .Where(f => f.UserId == currentUserId.Value);

        if (request.ProjectId.HasValue)
        {
            query = query.Where(f => f.ProjectId == null || f.ProjectId == request.ProjectId.Value);
        }

        return await query
            .OrderByDescending(f => f.IsFavorite)
            .ThenBy(f => f.Name)
            .Select(f => new SavedFilterDto
            {
                Id = f.Id,
                UserId = f.UserId,
                ProjectId = f.ProjectId,
                Name = f.Name,
                FilterQuery = f.FilterQuery,
                IsFavorite = f.IsFavorite,
                CreatedAt = f.CreatedAt,
                UpdatedAt = f.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }
}
