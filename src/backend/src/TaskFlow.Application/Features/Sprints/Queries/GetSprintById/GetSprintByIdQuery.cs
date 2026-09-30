using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Issues.DTOs;
using TaskFlow.Application.Features.Labels.DTOs;
using TaskFlow.Application.Features.Sprints.DTOs;

namespace TaskFlow.Application.Features.Sprints.Queries.GetSprintById;

public record GetSprintByIdQuery(Guid Id) : IRequest<SprintDetailDto>;

public class GetSprintByIdQueryHandler : IRequestHandler<GetSprintByIdQuery, SprintDetailDto>
{
    private readonly IApplicationDbContext _context;

    public GetSprintByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SprintDetailDto> Handle(GetSprintByIdQuery request, CancellationToken cancellationToken)
    {
        var sprint = await _context.Sprints
            .AsNoTracking()
            .Include(s => s.Issues.Where(i => i.DeletedAt == null))
                .ThenInclude(i => i.Type)
            .Include(s => s.Issues.Where(i => i.DeletedAt == null))
                .ThenInclude(i => i.Status)
            .Include(s => s.Issues.Where(i => i.DeletedAt == null))
                .ThenInclude(i => i.Assignee)
            .Include(s => s.Issues.Where(i => i.DeletedAt == null))
                .ThenInclude(i => i.Reporter)
            .Include(s => s.Issues.Where(i => i.DeletedAt == null))
                .ThenInclude(i => i.IssueLabels)
                    .ThenInclude(il => il.Label)
            .Include(s => s.Issues.Where(i => i.DeletedAt == null))
                .ThenInclude(i => i.Comments.Where(c => c.DeletedAt == null))
            .Include(s => s.Issues.Where(i => i.DeletedAt == null))
                .ThenInclude(i => i.Attachments)
            .Include(s => s.Issues.Where(i => i.DeletedAt == null))
                .ThenInclude(i => i.Subtasks.Where(sub => sub.DeletedAt == null))
            .FirstOrDefaultAsync(s => s.Id == request.Id && s.DeletedAt == null, cancellationToken);

        if (sprint == null)
        {
            throw new NotFoundException("Sprint", request.Id);
        }

        var totalPoints = sprint.Issues.Sum(i => i.StoryPoints ?? 0);
        var completedPoints = sprint.Issues.Where(i => i.Status.IsCompletedStatus).Sum(i => i.StoryPoints ?? 0);

        return new SprintDetailDto
        {
            Id = sprint.Id,
            ProjectId = sprint.ProjectId,
            Name = sprint.Name,
            Goal = sprint.Goal,
            Status = sprint.Status,
            StartDate = sprint.StartDate,
            EndDate = sprint.EndDate,
            CompletedAt = sprint.CompletedAt,
            IssueCount = sprint.Issues.Count,
            TotalStoryPoints = totalPoints,
            CompletedStoryPoints = completedPoints,
            CreatedAt = sprint.CreatedAt,
            Issues = sprint.Issues
                .OrderBy(i => i.Position)
                .Select(i => new IssueDto
                {
                    Id = i.Id,
                    ProjectId = i.ProjectId,
                    IssueNumber = i.IssueNumber,
                    IssueKey = i.IssueKey,
                    Title = i.Title,
                    Description = i.Description,
                    TypeId = i.TypeId,
                    TypeName = i.Type.Name,
                    TypeIconName = i.Type.IconName,
                    TypeCategory = i.Type.Category,
                    StatusId = i.StatusId,
                    StatusName = i.Status.Name,
                    StatusColorHex = i.Status.ColorHex,
                    IsCompletedStatus = i.Status.IsCompletedStatus,
                    Priority = i.Priority,
                    AssigneeId = i.AssigneeId,
                    AssigneeName = i.Assignee?.FullName,
                    AssigneeAvatarUrl = i.Assignee?.AvatarUrl,
                    ReporterId = i.ReporterId,
                    ReporterName = i.Reporter.FullName,
                    ReporterAvatarUrl = i.Reporter.AvatarUrl,
                    SprintId = i.SprintId,
                    SprintName = sprint.Name,
                    ParentId = i.ParentId,
                    StoryPoints = i.StoryPoints,
                    Position = i.Position,
                    DueDate = i.DueDate,
                    RowVersion = i.RowVersion,
                    Labels = i.IssueLabels.Select(il => new LabelDto
                    {
                        Id = il.Label.Id,
                        ProjectId = il.Label.ProjectId,
                        Name = il.Label.Name,
                        ColorHex = il.Label.ColorHex
                    }).ToList(),
                    CommentCount = i.Comments.Count,
                    AttachmentCount = i.Attachments.Count,
                    SubtaskCount = i.Subtasks.Count,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt
                }).ToList()
        };
    }
}
