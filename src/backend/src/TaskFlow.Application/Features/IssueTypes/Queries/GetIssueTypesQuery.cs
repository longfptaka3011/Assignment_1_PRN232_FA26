using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.IssueTypes.DTOs;

namespace TaskFlow.Application.Features.IssueTypes.Queries;

public record GetIssueTypesQuery(Guid ProjectId) : IRequest<List<IssueTypeDto>>;

public class GetIssueTypesQueryHandler : IRequestHandler<GetIssueTypesQuery, List<IssueTypeDto>>
{
    private readonly IApplicationDbContext _context;

    public GetIssueTypesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<IssueTypeDto>> Handle(GetIssueTypesQuery request, CancellationToken cancellationToken)
    {
        return await _context.IssueTypes
            .AsNoTracking()
            .Where(t => t.ProjectId == request.ProjectId)
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
            })
            .ToListAsync(cancellationToken);
    }
}
