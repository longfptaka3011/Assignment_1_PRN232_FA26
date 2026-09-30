using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Profiles.DTOs;

namespace TaskFlow.Application.Features.Profiles.Queries;

public record SearchProfilesQuery(string Query) : IRequest<List<ProfileDto>>;

public class SearchProfilesQueryHandler : IRequestHandler<SearchProfilesQuery, List<ProfileDto>>
{
    private readonly IApplicationDbContext _context;

    public SearchProfilesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProfileDto>> Handle(SearchProfilesQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Query))
        {
            return await _context.Profiles
                .AsNoTracking()
                .OrderBy(p => p.FullName)
                .Take(20)
                .Select(p => new ProfileDto
                {
                    Id = p.Id,
                    Email = p.Email,
                    FullName = p.FullName,
                    AvatarUrl = p.AvatarUrl,
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync(cancellationToken);
        }

        var search = request.Query.Trim().ToLower();

        return await _context.Profiles
            .AsNoTracking()
            .Where(p => p.FullName.ToLower().Contains(search) || p.Email.ToLower().Contains(search))
            .OrderBy(p => p.FullName)
            .Take(20)
            .Select(p => new ProfileDto
            {
                Id = p.Id,
                Email = p.Email,
                FullName = p.FullName,
                AvatarUrl = p.AvatarUrl,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }
}
