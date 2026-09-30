using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Attachments.Commands.DeleteAttachment;

public record DeleteAttachmentCommand(Guid Id) : IRequest<bool>;

public class DeleteAttachmentCommandHandler : IRequestHandler<DeleteAttachmentCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ISupabaseStorageService _storageService;

    public DeleteAttachmentCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ISupabaseStorageService storageService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _storageService = storageService;
    }

    public async Task<bool> Handle(DeleteAttachmentCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var attachment = await _context.Attachments
            .Include(a => a.Issue)
                .ThenInclude(i => i.Project)
                    .ThenInclude(p => p.Members)
            .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

        if (attachment == null)
        {
            throw new NotFoundException("Attachment", request.Id);
        }

        var isAuthor = attachment.UserId == currentUserId.Value;
        var callerMember = attachment.Issue.Project.Members.FirstOrDefault(m => m.UserId == currentUserId.Value);
        var isOwnerOrAdmin = callerMember?.Role == ProjectRole.Owner || callerMember?.Role == ProjectRole.Admin || attachment.Issue.Project.LeadId == currentUserId.Value;

        if (!isAuthor && !isOwnerOrAdmin)
        {
            throw new ForbiddenAccessException("You do not have permission to delete this attachment.");
        }

        // Delete from Supabase Storage
        await _storageService.DeleteFileAsync("attachments", attachment.FilePath);

        _context.Attachments.Remove(attachment);

        _context.ActivityLogs.Add(new ActivityLog
        {
            Id = Guid.NewGuid(),
            IssueId = attachment.IssueId,
            UserId = currentUserId.Value,
            ActivityType = ActivityType.AttachmentRemoved,
            OldValue = attachment.FileName,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
