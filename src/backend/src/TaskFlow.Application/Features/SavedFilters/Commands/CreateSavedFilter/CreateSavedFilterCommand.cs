using FluentValidation;
using MediatR;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.SavedFilters.DTOs;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.Features.SavedFilters.Commands.CreateSavedFilter;

public record CreateSavedFilterCommand : IRequest<SavedFilterDto>
{
    public string Name { get; init; } = string.Empty;
    public Guid? ProjectId { get; init; }
    public string FilterQuery { get; init; } = "{}";
    public bool IsFavorite { get; init; } = false;
}

public class CreateSavedFilterCommandValidator : AbstractValidator<CreateSavedFilterCommand>
{
    public CreateSavedFilterCommandValidator()
    {
        RuleFor(v => v.Name)
            .NotEmpty().WithMessage("Filter name is required.")
            .MaximumLength(100).WithMessage("Filter name cannot exceed 100 characters.");

        RuleFor(v => v.FilterQuery)
            .NotEmpty().WithMessage("Filter query cannot be empty.");
    }
}

public class CreateSavedFilterCommandHandler : IRequestHandler<CreateSavedFilterCommand, SavedFilterDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateSavedFilterCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<SavedFilterDto> Handle(CreateSavedFilterCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var filter = new SavedFilter
        {
            Id = Guid.NewGuid(),
            UserId = currentUserId.Value,
            ProjectId = request.ProjectId,
            Name = request.Name.Trim(),
            FilterQuery = request.FilterQuery,
            IsFavorite = request.IsFavorite,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.SavedFilters.Add(filter);
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
