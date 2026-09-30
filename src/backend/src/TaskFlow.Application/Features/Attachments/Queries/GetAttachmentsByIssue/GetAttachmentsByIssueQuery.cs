using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Features.Attachments.DTOs;

namespace TaskFlow.Application.Features.Attachments.Queries.GetAttachmentsByIssue;

public record GetAttachmentsByIssueQuery(Guid IssueId) : IRequest<List<AttachmentDto>>;

public class GetAttachmentsByIssueQueryHandler : IRequestHandler<GetAttachmentsByIssueQuery, List<AttachmentDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ISupabaseStorageService _storageService;

    public GetAttachmentsByIssueQueryHandler(IApplicationDbContext context, ISupabaseStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    public async Task<List<AttachmentDto>> Handle(GetAttachmentsByIssueQuery request, CancellationToken cancellationToken)
    {
        var attachments = await _context.Attachments
            .AsNoTracking()
            .Where(a => a.IssueId == request.IssueId)
            .Include(a => a.User)
            .OrderBy(a => a.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = new List<AttachmentDto>();
        foreach (var a in attachments)
        {
            var downloadUrl = await _storageService.GetSignedUrlAsync("attachments", a.FilePath);
            result.Add(new AttachmentDto
            {
                Id = a.Id,
                IssueId = a.IssueId,
                UserId = a.UserId,
                UserName = a.User.FullName,
                FileName = a.FileName,
                FilePath = a.FilePath,
                DownloadUrl = downloadUrl,
                FileSizeBytes = a.FileSizeBytes,
                ContentType = a.ContentType,
                CreatedAt = a.CreatedAt
            });
        }

        return result;
    }
}
