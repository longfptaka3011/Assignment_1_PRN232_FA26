using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Profiles.DTOs;

namespace TaskFlow.Application.Features.Profiles.Commands;

public record UpdateProfileCommand : IRequest<ProfileDto>
{
    public string FullName { get; init; } = string.Empty;
    public string? AvatarUrl { get; init; }
}

public class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileCommandValidator()
    {
        RuleFor(v => v.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(150).WithMessage("Full name must not exceed 150 characters.");

        RuleFor(v => v.AvatarUrl)
            .MaximumLength(1000).WithMessage("Avatar URL must not exceed 1000 characters.");
    }
}

public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, ProfileDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateProfileCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ProfileDto> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
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
            throw new NotFoundException("Profile", userId.Value);
        }

        profile.FullName = request.FullName.Trim();
        profile.AvatarUrl = request.AvatarUrl;
        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

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
