using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Attachments.DTOs;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.Attachments.Commands.CreateAttachment;

public record CreateAttachmentCommand : IRequest<AttachmentDto>
{
    public Guid IssueId { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string FilePath { get; init; } = string.Empty;
    public long FileSizeBytes { get; init; }
    public string ContentType { get; init; } = string.Empty;
}

public class CreateAttachmentCommandValidator : AbstractValidator<CreateAttachmentCommand>
{
    public CreateAttachmentCommandValidator()
    {
        RuleFor(v => v.IssueId).NotEmpty();
        RuleFor(v => v.FileName).NotEmpty().MaximumLength(255);
        RuleFor(v => v.FilePath).NotEmpty();
        RuleFor(v => v.FileSizeBytes).GreaterThan(0);
        RuleFor(v => v.ContentType).NotEmpty().MaximumLength(100);
    }
}

public class CreateAttachmentCommandHandler : IRequestHandler<CreateAttachmentCommand, AttachmentDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ISupabaseStorageService _storageService;

    public CreateAttachmentCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ISupabaseStorageService storageService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _storageService = storageService;
    }

    public async Task<AttachmentDto> Handle(CreateAttachmentCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var issue = await _context.Issues
            .FirstOrDefaultAsync(i => i.Id == request.IssueId && i.DeletedAt == null, cancellationToken);

        if (issue == null)
        {
            throw new NotFoundException("Issue", request.IssueId);
        }

        var user = await _context.Profiles
            .FirstOrDefaultAsync(p => p.Id == currentUserId.Value, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("Profile", currentUserId.Value);
        }

        var attachment = new Attachment
        {
            Id = Guid.NewGuid(),
            IssueId = issue.Id,
            UserId = user.Id,
            FileName = request.FileName.Trim(),
            FilePath = request.FilePath.Trim(),
            FileSizeBytes = request.FileSizeBytes,
            ContentType = request.ContentType.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Attachments.Add(attachment);

        _context.ActivityLogs.Add(new ActivityLog
        {
            Id = Guid.NewGuid(),
            IssueId = issue.Id,
            UserId = user.Id,
            ActivityType = ActivityType.AttachmentAdded,
            NewValue = attachment.FileName,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);

        var downloadUrl = await _storageService.GetSignedUrlAsync("attachments", attachment.FilePath);

        return new AttachmentDto
        {
            Id = attachment.Id,
            IssueId = attachment.IssueId,
            UserId = user.Id,
            UserName = user.FullName,
            FileName = attachment.FileName,
            FilePath = attachment.FilePath,
            DownloadUrl = downloadUrl,
            FileSizeBytes = attachment.FileSizeBytes,
            ContentType = attachment.ContentType,
            CreatedAt = attachment.CreatedAt
        };
    }
}
