using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.IssueStatuses.DTOs;
using TaskFlow.Application.Features.IssueTypes.DTOs;
using TaskFlow.Application.Features.Labels.DTOs;
using TaskFlow.Application.Features.Projects.DTOs;

namespace TaskFlow.Application.Features.Projects.Queries.GetProjectByKey;

public record GetProjectByKeyQuery(string Key) : IRequest<ProjectDetailDto>;

public class GetProjectByKeyQueryHandler : IRequestHandler<GetProjectByKeyQuery, ProjectDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetProjectByKeyQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectDetailDto> Handle(GetProjectByKeyQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var key = request.Key.Trim().ToUpperInvariant();

        var project = await _context.Projects
            .AsNoTracking()
            .Include(p => p.Lead)
            .Include(p => p.Members)
                .ThenInclude(m => m.User)
            .Include(p => p.IssueTypes)
            .Include(p => p.IssueStatuses)
            .Include(p => p.Labels)
            .Include(p => p.Issues.Where(i => i.DeletedAt == null))
            .FirstOrDefaultAsync(p => p.Key == key && p.DeletedAt == null, cancellationToken);

        if (project == null)
        {
            throw new NotFoundException("Project", key);
        }

        // Verify user is a member or lead
        var isMember = project.LeadId == userId.Value || project.Members.Any(m => m.UserId == userId.Value);
        if (!isMember)
        {
            throw new ForbiddenAccessException("You are not a member of this project.");
        }

        return new ProjectDetailDto
        {
            Id = project.Id,
            Name = project.Name,
            Key = project.Key,
            Description = project.Description,
            LeadId = project.LeadId,
            LeadName = project.Lead.FullName,
            LeadAvatarUrl = project.Lead.AvatarUrl,
            IssueCounter = project.IssueCounter,
            IsArchived = project.IsArchived,
            MemberCount = project.Members.Count,
            IssueCount = project.Issues.Count,
            CreatedAt = project.CreatedAt,
            Members = project.Members
                .OrderBy(m => m.JoinedAt)
                .Select(m => new ProjectMemberDto
                {
                    Id = m.Id,
                    ProjectId = m.ProjectId,
                    UserId = m.UserId,
                    Email = m.User.Email,
                    FullName = m.User.FullName,
                    AvatarUrl = m.User.AvatarUrl,
                    Role = m.Role,
                    JoinedAt = m.JoinedAt
                }).ToList(),
            IssueTypes = project.IssueTypes
                .OrderBy(t => t.OrderIndex)
                .Select(t => new IssueTypeDto
                {
                    Id = t.Id,
                    ProjectId = t.ProjectId,
                    Name = t.Name,
                    IconName = t.IconName,
                    Category = t.Category,
                    OrderIndex = t.OrderIndex,
                    IsSubtask = t.IsSubtask
                }).ToList(),
            IssueStatuses = project.IssueStatuses
                .OrderBy(s => s.OrderIndex)
                .Select(s => new IssueStatusDto
                {
                    Id = s.Id,
                    ProjectId = s.ProjectId,
                    Name = s.Name,
                    ColorHex = s.ColorHex,
                    OrderIndex = s.OrderIndex,
                    IsCompletedStatus = s.IsCompletedStatus
                }).ToList(),
            Labels = project.Labels
                .OrderBy(l => l.Name)
                .Select(l => new LabelDto
                {
                    Id = l.Id,
                    ProjectId = l.ProjectId,
                    Name = l.Name,
                    ColorHex = l.ColorHex
                }).ToList()
        };
    }
}
