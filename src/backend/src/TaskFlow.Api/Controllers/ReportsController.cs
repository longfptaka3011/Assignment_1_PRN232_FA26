using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Features.Reports.DTOs;
using TaskFlow.Application.Features.Reports.Queries.GetProjectVelocity;
using TaskFlow.Application.Features.Reports.Queries.GetSprintBurndown;
using TaskFlow.Application.Features.Reports.Queries.GetWorkloadDistribution;

namespace TaskFlow.Api.Controllers;

[Authorize]
public class ReportsController : ApiControllerBase
{
    [HttpGet("/api/v1/sprints/{sprintId:guid}/burndown")]
    public async Task<ActionResult<SprintBurndownDto>> GetSprintBurndown(Guid sprintId, CancellationToken cancellationToken)
    {
        return Ok(await Mediator.Send(new GetSprintBurndownQuery(sprintId), cancellationToken));
    }

    [HttpGet("/api/v1/projects/{projectId:guid}/velocity")]
    public async Task<ActionResult<List<SprintVelocityDto>>> GetProjectVelocity(Guid projectId, CancellationToken cancellationToken)
    {
        return Ok(await Mediator.Send(new GetProjectVelocityQuery(projectId), cancellationToken));
    }

    [HttpGet("/api/v1/projects/{projectId:guid}/workload")]
    public async Task<ActionResult<List<MemberWorkloadDto>>> GetWorkloadDistribution(
        Guid projectId,
        [FromQuery] Guid? sprintId,
        CancellationToken cancellationToken)
    {
        return Ok(await Mediator.Send(new GetWorkloadDistributionQuery(projectId, sprintId), cancellationToken));
    }
}
