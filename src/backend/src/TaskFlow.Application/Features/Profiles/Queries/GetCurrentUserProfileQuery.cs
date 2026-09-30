using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Profiles.DTOs;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.Features.Profiles.Queries;

public record GetCurrentUserProfileQuery : IRequest<ProfileDto>;

public class GetCurrentUserProfileQueryHandler : IRequestHandler<GetCurrentUserProfileQuery, ProfileDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetCurrentUserProfileQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ProfileDto> Handle(GetCurrentUserProfileQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var profile = await _context.Profiles
            .FirstOrDefaultAsync(p => p.Id == userId.Value, cancellationToken);

        if (profile == null)
        {
            // Auto-provision profile from claims if not yet in database
            var email = _currentUserService.Email ?? $"{userId.Value}@user.taskflow";
            var fullName = email.Split('@')[0];

            profile = new Profile
            {
                Id = userId.Value,
                Email = email,
                FullName = fullName,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Profiles.Add(profile);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return new ProfileDto
        {
            Id = profile.Id,
            Email = profile.Email,
            FullName = profile.FullName,
            AvatarUrl = profile.AvatarUrl,
            CreatedAt = profile.CreatedAt
        };
    }
}
