using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.IssueStatuses.DTOs;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.Features.IssueStatuses.Commands;

public record CreateIssueStatusCommand : IRequest<IssueStatusDto>
{
    public Guid ProjectId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string ColorHex { get; init; } = "#6B7280";
    public int OrderIndex { get; init; }
    public bool IsCompletedStatus { get; init; }
}

public class CreateIssueStatusCommandValidator : AbstractValidator<CreateIssueStatusCommand>
{
    public CreateIssueStatusCommandValidator()
    {
        RuleFor(v => v.ProjectId).NotEmpty();
        RuleFor(v => v.Name).NotEmpty().MaximumLength(50);
        RuleFor(v => v.ColorHex).NotEmpty().Matches(@"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
            .WithMessage("ColorHex must be a valid hex color code (e.g. #3B82F6).");
    }
}

public class CreateIssueStatusCommandHandler : IRequestHandler<CreateIssueStatusCommand, IssueStatusDto>
{
    private readonly IApplicationDbContext _context;

    public CreateIssueStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IssueStatusDto> Handle(CreateIssueStatusCommand request, CancellationToken cancellationToken)
    {
        var exists = await _context.IssueStatuses
            .AnyAsync(s => s.ProjectId == request.ProjectId && s.Name == request.Name.Trim(), cancellationToken);

        if (exists)
        {
            throw new ConflictException($"Status '{request.Name}' already exists in this project.");
        }

        var status = new IssueStatus
        {
            Id = Guid.NewGuid(),
            ProjectId = request.ProjectId,
            Name = request.Name.Trim(),
            ColorHex = request.ColorHex,
            OrderIndex = request.OrderIndex,
            IsCompletedStatus = request.IsCompletedStatus
        };

        _context.IssueStatuses.Add(status);
        await _context.SaveChangesAsync(cancellationToken);

        return new IssueStatusDto
        {
            Id = status.Id,
            ProjectId = status.ProjectId,
            Name = status.Name,
            ColorHex = status.ColorHex,
            OrderIndex = status.OrderIndex,
            IsCompletedStatus = status.IsCompletedStatus
        };
    }
}

public record UpdateIssueStatusCommand : IRequest<IssueStatusDto>
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string ColorHex { get; init; } = "#6B7280";
    public int OrderIndex { get; init; }
    public bool IsCompletedStatus { get; init; }
}

public class UpdateIssueStatusCommandValidator : AbstractValidator<UpdateIssueStatusCommand>
{
    public UpdateIssueStatusCommandValidator()
    {
        RuleFor(v => v.Id).NotEmpty();
        RuleFor(v => v.Name).NotEmpty().MaximumLength(50);
        RuleFor(v => v.ColorHex).NotEmpty().Matches(@"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
            .WithMessage("ColorHex must be a valid hex color code.");
    }
}

public class UpdateIssueStatusCommandHandler : IRequestHandler<UpdateIssueStatusCommand, IssueStatusDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateIssueStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IssueStatusDto> Handle(UpdateIssueStatusCommand request, CancellationToken cancellationToken)
    {
        var status = await _context.IssueStatuses
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (status == null)
        {
            throw new NotFoundException("IssueStatus", request.Id);
        }

        status.Name = request.Name.Trim();
        status.ColorHex = request.ColorHex;
        status.OrderIndex = request.OrderIndex;
        status.IsCompletedStatus = request.IsCompletedStatus;

        await _context.SaveChangesAsync(cancellationToken);

        return new IssueStatusDto
        {
            Id = status.Id,
            ProjectId = status.ProjectId,
            Name = status.Name,
            ColorHex = status.ColorHex,
            OrderIndex = status.OrderIndex,
            IsCompletedStatus = status.IsCompletedStatus
        };
    }
}

public record DeleteIssueStatusCommand(Guid Id) : IRequest<bool>;

public class DeleteIssueStatusCommandHandler : IRequestHandler<DeleteIssueStatusCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteIssueStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteIssueStatusCommand request, CancellationToken cancellationToken)
    {
        var status = await _context.IssueStatuses
            .Include(s => s.Issues.Where(i => i.DeletedAt == null))
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (status == null)
        {
            throw new NotFoundException("IssueStatus", request.Id);
        }

        if (status.Issues.Any())
        {
            throw new ConflictException("Cannot delete an issue status that still has assigned issues. Please reassign or delete them first.");
        }

        _context.IssueStatuses.Remove(status);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
