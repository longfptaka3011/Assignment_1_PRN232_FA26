using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Common.Models;
using TaskFlow.Application.Features.Issues.DTOs;
using TaskFlow.Application.Features.Labels.DTOs;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Issues.Queries.GetIssues;

public record GetIssuesQuery : IRequest<PaginatedList<IssueDto>>
{
    public Guid ProjectId { get; init; }
    public Guid? SprintId { get; init; }
    public bool BacklogOnly { get; init; } = false;
    public Guid? StatusId { get; init; }
    public Guid? AssigneeId { get; init; }
    public Guid? TypeId { get; init; }
    public IssuePriority? Priority { get; init; }
    public string? Search { get; init; }
    public bool? IsSubtask { get; init; }
    public Guid? ParentId { get; init; }
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 50;
}

public class GetIssuesQueryHandler : IRequestHandler<GetIssuesQuery, PaginatedList<IssueDto>>
{
    private readonly IApplicationDbContext _context;

    public GetIssuesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedList<IssueDto>> Handle(GetIssuesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Issues
            .AsNoTracking()
            .Where(i => i.ProjectId == request.ProjectId && i.DeletedAt == null);

        if (request.BacklogOnly)
        {
            query = query.Where(i => i.SprintId == null);
        }
        else if (request.SprintId.HasValue)
        {
            query = query.Where(i => i.SprintId == request.SprintId.Value);
        }

        if (request.StatusId.HasValue)
        {
            query = query.Where(i => i.StatusId == request.StatusId.Value);
        }

        if (request.AssigneeId.HasValue)
        {
            query = query.Where(i => i.AssigneeId == request.AssigneeId.Value);
        }

        if (request.TypeId.HasValue)
        {
            query = query.Where(i => i.TypeId == request.TypeId.Value);
        }

        if (request.Priority.HasValue)
        {
            query = query.Where(i => i.Priority == request.Priority.Value);
        }

        if (request.ParentId.HasValue)
        {
            query = query.Where(i => i.ParentId == request.ParentId.Value);
        }

        if (request.IsSubtask.HasValue)
        {
            query = request.IsSubtask.Value
                ? query.Where(i => i.ParentId != null)
                : query.Where(i => i.ParentId == null);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(i => i.Title.ToLower().Contains(search) 
                                  || i.IssueKey.ToLower().Contains(search) 
                                  || (i.Description != null && i.Description.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(i => i.Position)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
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
                AssigneeName = i.Assignee != null ? i.Assignee.FullName : null,
                AssigneeAvatarUrl = i.Assignee != null ? i.Assignee.AvatarUrl : null,
                ReporterId = i.ReporterId,
                ReporterName = i.Reporter.FullName,
                ReporterAvatarUrl = i.Reporter.AvatarUrl,
                SprintId = i.SprintId,
                SprintName = i.Sprint != null ? i.Sprint.Name : null,
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
                CommentCount = i.Comments.Count(c => c.DeletedAt == null),
                AttachmentCount = i.Attachments.Count,
                SubtaskCount = i.Subtasks.Count(s => s.DeletedAt == null),
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return new PaginatedList<IssueDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}
