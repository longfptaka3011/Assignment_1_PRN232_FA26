using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.WorkflowTransitions.DTOs;

namespace TaskFlow.Application.Features.WorkflowTransitions.Queries.GetWorkflowTransitions;

public record GetWorkflowTransitionsQuery(Guid ProjectId) : IRequest<List<WorkflowTransitionDto>>;

public class GetWorkflowTransitionsQueryHandler : IRequestHandler<GetWorkflowTransitionsQuery, List<WorkflowTransitionDto>>
{
    private readonly IApplicationDbContext _context;

    public GetWorkflowTransitionsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<WorkflowTransitionDto>> Handle(GetWorkflowTransitionsQuery request, CancellationToken cancellationToken)
    {
        return await _context.WorkflowTransitions
            .AsNoTracking()
            .Where(t => t.ProjectId == request.ProjectId)
            .Include(t => t.FromStatus)
            .Include(t => t.ToStatus)
            .Select(t => new WorkflowTransitionDto
            {
                Id = t.Id,
                ProjectId = t.ProjectId,
                FromStatusId = t.FromStatusId,
                FromStatusName = t.FromStatus.Name,
                FromStatusColorHex = t.FromStatus.ColorHex,
                ToStatusId = t.ToStatusId,
                ToStatusName = t.ToStatus.Name,
                ToStatusColorHex = t.ToStatus.ColorHex,
                Name = t.Name
            })
            .ToListAsync(cancellationToken);
    }
}
