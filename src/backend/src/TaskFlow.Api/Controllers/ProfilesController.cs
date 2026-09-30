using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Features.Profiles.Commands;
using TaskFlow.Application.Features.Profiles.DTOs;
using TaskFlow.Application.Features.Profiles.Queries;

namespace TaskFlow.Api.Controllers;

[Authorize]
public class ProfilesController : ApiControllerBase
{
    [HttpGet("me")]
    public async Task<ActionResult<ProfileDto>> GetCurrentUserProfile(CancellationToken cancellationToken = default)
    {
        return Ok(await Mediator.Send(new GetCurrentUserProfileQuery(), cancellationToken));
    }

    [HttpPut("me")]
    public async Task<ActionResult<ProfileDto>> UpdateProfile([FromBody] UpdateProfileCommand command, CancellationToken cancellationToken = default)
    {
        return Ok(await Mediator.Send(command, cancellationToken));
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<ProfileDto>>> SearchProfiles([FromQuery] string query = "", CancellationToken cancellationToken = default)
    {
        return Ok(await Mediator.Send(new SearchProfilesQuery(query), cancellationToken));
    }
}
