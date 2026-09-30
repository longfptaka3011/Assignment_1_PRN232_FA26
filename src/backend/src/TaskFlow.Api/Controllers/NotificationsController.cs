using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Features.Notifications.Commands;
using TaskFlow.Application.Features.Notifications.DTOs;
using TaskFlow.Application.Features.Notifications.Queries.GetNotifications;

namespace TaskFlow.Api.Controllers;

[Authorize]
public class NotificationsController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> GetNotifications([FromQuery] bool? unreadOnly = null, CancellationToken cancellationToken = default)
    {
        return Ok(await Mediator.Send(new GetNotificationsQuery(unreadOnly), cancellationToken));
    }

    [HttpPut("{id:guid}/read")]
    public async Task<ActionResult> MarkAsRead(Guid id, CancellationToken cancellationToken = default)
    {
        await Mediator.Send(new MarkNotificationAsReadCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPut("read-all")]
    public async Task<ActionResult> MarkAllAsRead(CancellationToken cancellationToken = default)
    {
        await Mediator.Send(new MarkAllNotificationsAsReadCommand(), cancellationToken);
        return NoContent();
    }
}
