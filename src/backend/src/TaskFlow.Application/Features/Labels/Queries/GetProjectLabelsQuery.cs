using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Labels.DTOs;

namespace TaskFlow.Application.Features.Labels.Queries;

public record GetProjectLabelsQuery(Guid ProjectId) : IRequest<List<LabelDto>>;

public class GetProjectLabelsQueryHandler : IRequestHandler<GetProjectLabelsQuery, List<LabelDto>>
{
    private readonly IApplicationDbContext _context;

    public GetProjectLabelsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<LabelDto>> Handle(GetProjectLabelsQuery request, CancellationToken cancellationToken)
    {
        return await _context.Labels
            .AsNoTracking()
            .Where(l => l.ProjectId == request.ProjectId)
            .OrderBy(l => l.Name)
            .Select(l => new LabelDto
            {
                Id = l.Id,
                ProjectId = l.ProjectId,
                Name = l.Name,
                ColorHex = l.ColorHex
            })
            .ToListAsync(cancellationToken);
    }
}
