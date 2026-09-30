using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Notifications.DTOs;

namespace TaskFlow.Application.Features.Notifications.Queries.GetNotifications;

public record GetNotificationsQuery(bool? UnreadOnly = null) : IRequest<List<NotificationDto>>;

public class GetNotificationsQueryHandler : IRequestHandler<GetNotificationsQuery, List<NotificationDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetNotificationsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<NotificationDto>> Handle(GetNotificationsQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var query = _context.Notifications
            .AsNoTracking()
            .Where(n => n.RecipientId == currentUserId.Value);

        if (request.UnreadOnly.HasValue && request.UnreadOnly.Value)
        {
            query = query.Where(n => !n.IsRead);
        }

        return await query
            .Include(n => n.Sender)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                RecipientId = n.RecipientId,
                SenderId = n.SenderId,
                SenderName = n.Sender.FullName,
                SenderAvatarUrl = n.Sender.AvatarUrl,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                LinkUrl = n.LinkUrl,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }
}
