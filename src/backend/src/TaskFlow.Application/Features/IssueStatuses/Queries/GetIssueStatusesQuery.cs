using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.IssueStatuses.DTOs;

namespace TaskFlow.Application.Features.IssueStatuses.Queries;

public record GetIssueStatusesQuery(Guid ProjectId) : IRequest<List<IssueStatusDto>>;

public class GetIssueStatusesQueryHandler : IRequestHandler<GetIssueStatusesQuery, List<IssueStatusDto>>
{
    private readonly IApplicationDbContext _context;

    public GetIssueStatusesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<IssueStatusDto>> Handle(GetIssueStatusesQuery request, CancellationToken cancellationToken)
    {
        return await _context.IssueStatuses
            .AsNoTracking()
            .Where(s => s.ProjectId == request.ProjectId)
            .OrderBy(s => s.OrderIndex)
            .Select(s => new IssueStatusDto
            {
                Id = s.Id,
                ProjectId = s.ProjectId,
                Name = s.Name,
                ColorHex = s.ColorHex,
                OrderIndex = s.OrderIndex,
                IsCompletedStatus = s.IsCompletedStatus
            })
            .ToListAsync(cancellationToken);
    }
}
