using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.SavedFilters.DTOs;

namespace TaskFlow.Application.Features.SavedFilters.Commands.UpdateSavedFilter;

public record UpdateSavedFilterCommand : IRequest<SavedFilterDto>
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string FilterQuery { get; init; } = "{}";
    public bool IsFavorite { get; init; }
}

public class UpdateSavedFilterCommandValidator : AbstractValidator<UpdateSavedFilterCommand>
{
    public UpdateSavedFilterCommandValidator()
    {
        RuleFor(v => v.Id).NotEmpty();
        RuleFor(v => v.Name)
            .NotEmpty().WithMessage("Filter name is required.")
            .MaximumLength(100).WithMessage("Filter name cannot exceed 100 characters.");
        RuleFor(v => v.FilterQuery).NotEmpty();
    }
}

public class UpdateSavedFilterCommandHandler : IRequestHandler<UpdateSavedFilterCommand, SavedFilterDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateSavedFilterCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<SavedFilterDto> Handle(UpdateSavedFilterCommand request, CancellationToken cancellationToken)
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

        filter.Name = request.Name.Trim();
        filter.FilterQuery = request.FilterQuery;
        filter.IsFavorite = request.IsFavorite;
        filter.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new SavedFilterDto
        {
            Id = filter.Id,
            UserId = filter.UserId,
            ProjectId = filter.ProjectId,
            Name = filter.Name,
            FilterQuery = filter.FilterQuery,
            IsFavorite = filter.IsFavorite,
            CreatedAt = filter.CreatedAt,
            UpdatedAt = filter.UpdatedAt
        };
    }
}
