using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Projects.DTOs;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Projects.Commands.UpdateProject;

public record UpdateProjectCommand : IRequest<ProjectDto>
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Guid? LeadId { get; init; }
}

public class UpdateProjectCommandValidator : AbstractValidator<UpdateProjectCommand>
{
    public UpdateProjectCommandValidator()
    {
        RuleFor(v => v.Name)
            .NotEmpty().WithMessage("Project name is required.")
            .MaximumLength(150).WithMessage("Project name must not exceed 150 characters.");

        RuleFor(v => v.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters.");
    }
}

public class UpdateProjectCommandHandler : IRequestHandler<UpdateProjectCommand, ProjectDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateProjectCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectDto> Handle(UpdateProjectCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var project = await _context.Projects
            .Include(p => p.Lead)
            .Include(p => p.Members)
            .Include(p => p.Issues.Where(i => i.DeletedAt == null))
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.DeletedAt == null, cancellationToken);

        if (project == null)
        {
            throw new NotFoundException("Project", request.Id);
        }

        // Verify caller is Owner or Admin
        var callerMember = project.Members.FirstOrDefault(m => m.UserId == userId.Value);
        var isOwnerOrAdmin = callerMember?.Role == ProjectRole.Owner || callerMember?.Role == ProjectRole.Admin || project.LeadId == userId.Value;
        if (!isOwnerOrAdmin)
        {
            throw new ForbiddenAccessException("Only project owners and admins can update project details.");
        }

        project.Name = request.Name.Trim();
        project.Description = request.Description?.Trim();

        if (request.LeadId.HasValue && request.LeadId.Value != project.LeadId)
        {
            // Lead must be a project member
            var newLeadMember = project.Members.FirstOrDefault(m => m.UserId == request.LeadId.Value);
            if (newLeadMember == null)
            {
                throw new ConflictException("New project lead must be an existing member of the project.");
            }
            project.LeadId = request.LeadId.Value;
        }

        project.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        var leadProfile = await _context.Profiles.FirstOrDefaultAsync(p => p.Id == project.LeadId, cancellationToken);

        return new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Key = project.Key,
            Description = project.Description,
            LeadId = project.LeadId,
            LeadName = leadProfile?.FullName ?? project.Lead?.FullName ?? "",
            LeadAvatarUrl = leadProfile?.AvatarUrl ?? project.Lead?.AvatarUrl,
            IssueCounter = project.IssueCounter,
            IsArchived = project.IsArchived,
            MemberCount = project.Members.Count,
            IssueCount = project.Issues.Count,
            CreatedAt = project.CreatedAt
        };
    }
}
