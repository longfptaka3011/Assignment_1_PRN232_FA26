using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.IssueLinks.DTOs;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.IssueLinks.Queries.GetIssueLinks;

public record GetIssueLinksQuery(Guid IssueId) : IRequest<List<IssueLinkDto>>;

public class GetIssueLinksQueryHandler : IRequestHandler<GetIssueLinksQuery, List<IssueLinkDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IProjectAuthorizationService _projectAuthService;

    public GetIssueLinksQueryHandler(
        IApplicationDbContext context,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _projectAuthService = projectAuthService;
    }

    public async Task<List<IssueLinkDto>> Handle(GetIssueLinksQuery request, CancellationToken cancellationToken)
    {
        var issue = await _context.Issues
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == request.IssueId && i.DeletedAt == null, cancellationToken);

        if (issue == null)
        {
            throw new NotFoundException("Issue", request.IssueId);
        }

        // Anti-IDOR: Check caller has access to the issue's project
        await _projectAuthService.EnsureMemberAsync(issue.ProjectId, cancellationToken);

        // Fetch links where issue is either source or target
        var links = await _context.IssueLinks
            .AsNoTracking()
            .Include(il => il.SourceIssue).ThenInclude(i => i.Status)
            .Include(il => il.TargetIssue).ThenInclude(i => i.Status)
            .Include(il => il.Creator)
            .Where(il => il.SourceIssueId == request.IssueId || il.TargetIssueId == request.IssueId)
            .OrderBy(il => il.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = new List<IssueLinkDto>();

        foreach (var link in links)
        {
            var isSource = link.SourceIssueId == request.IssueId;
            var otherIssue = isSource ? link.TargetIssue : link.SourceIssue;

            string relationshipText;
            if (isSource)
            {
                relationshipText = link.LinkType switch
                {
                    IssueLinkType.Blocks => "blocks",
                    IssueLinkType.IsBlockedBy => "is blocked by",
                    IssueLinkType.RelatesTo => "relates to",
                    IssueLinkType.Duplicates => "duplicates",
                    _ => "relates to"
                };
            }
            else
            {
                // Inverted relationship
                relationshipText = link.LinkType switch
                {
                    IssueLinkType.Blocks => "is blocked by",
                    IssueLinkType.IsBlockedBy => "blocks",
                    IssueLinkType.RelatesTo => "relates to",
                    IssueLinkType.Duplicates => "is duplicated by",
                    _ => "relates to"
                };
            }

            result.Add(new IssueLinkDto
            {
                Id = link.Id,
                SourceIssueId = link.SourceIssueId,
                SourceIssueKey = link.SourceIssue.IssueKey,
                SourceTitle = link.SourceIssue.Title,
                TargetIssueId = otherIssue.Id,
                TargetIssueKey = otherIssue.IssueKey,
                TargetTitle = otherIssue.Title,
                TargetStatusName = otherIssue.Status?.Name ?? "Unknown",
                TargetStatusColorHex = otherIssue.Status?.ColorHex ?? "#6B7280",
                LinkType = link.LinkType,
                RelationshipText = relationshipText,
                CreatedBy = link.CreatedBy,
                CreatorName = link.Creator.FullName,
                CreatedAt = link.CreatedAt
            });
        }

        return result;
    }
}
