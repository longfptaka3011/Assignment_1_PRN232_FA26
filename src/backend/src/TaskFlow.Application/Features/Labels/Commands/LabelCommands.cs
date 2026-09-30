using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Labels.DTOs;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.Features.Labels.Commands;

public record CreateLabelCommand : IRequest<LabelDto>
{
    public Guid ProjectId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string ColorHex { get; init; } = "#3B82F6";
}

public class CreateLabelCommandValidator : AbstractValidator<CreateLabelCommand>
{
    public CreateLabelCommandValidator()
    {
        RuleFor(v => v.ProjectId).NotEmpty();
        RuleFor(v => v.Name).NotEmpty().MaximumLength(50);
        RuleFor(v => v.ColorHex).NotEmpty().Matches(@"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
            .WithMessage("ColorHex must be a valid hex color code.");
    }
}

public class CreateLabelCommandHandler : IRequestHandler<CreateLabelCommand, LabelDto>
{
    private readonly IApplicationDbContext _context;

    public CreateLabelCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<LabelDto> Handle(CreateLabelCommand request, CancellationToken cancellationToken)
    {
        var exists = await _context.Labels
            .AnyAsync(l => l.ProjectId == request.ProjectId && l.Name == request.Name.Trim(), cancellationToken);

        if (exists)
        {
            throw new ConflictException($"Label '{request.Name}' already exists in this project.");
        }

        var label = new Label
        {
            Id = Guid.NewGuid(),
            ProjectId = request.ProjectId,
            Name = request.Name.Trim(),
            ColorHex = request.ColorHex
        };

        _context.Labels.Add(label);
        await _context.SaveChangesAsync(cancellationToken);

        return new LabelDto
        {
            Id = label.Id,
            ProjectId = label.ProjectId,
            Name = label.Name,
            ColorHex = label.ColorHex
        };
    }
}

public record DeleteLabelCommand(Guid Id) : IRequest<bool>;

public class DeleteLabelCommandHandler : IRequestHandler<DeleteLabelCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteLabelCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteLabelCommand request, CancellationToken cancellationToken)
    {
        var label = await _context.Labels
            .FirstOrDefaultAsync(l => l.Id == request.Id, cancellationToken);

        if (label == null)
        {
            throw new NotFoundException("Label", request.Id);
        }

        _context.Labels.Remove(label);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
