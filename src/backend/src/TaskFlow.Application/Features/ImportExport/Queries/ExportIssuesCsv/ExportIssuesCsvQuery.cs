using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.ImportExport.Queries.ExportIssuesCsv;

public record ExportIssuesCsvQuery(Guid ProjectId, Guid? SprintId = null) : IRequest<byte[]>;

public class ExportIssuesCsvQueryHandler : IRequestHandler<ExportIssuesCsvQuery, byte[]>
{
    private readonly IApplicationDbContext _context;
    private readonly IProjectAuthorizationService _projectAuthService;

    public ExportIssuesCsvQueryHandler(
        IApplicationDbContext context,
        IProjectAuthorizationService projectAuthService)
    {
        _context = context;
        _projectAuthService = projectAuthService;
    }

    public async Task<byte[]> Handle(ExportIssuesCsvQuery request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId && p.DeletedAt == null, cancellationToken);

        if (project == null)
        {
            throw new NotFoundException("Project", request.ProjectId);
        }

        await _projectAuthService.EnsureRoleAsync(
            request.ProjectId,
            new[] { ProjectRole.Owner, ProjectRole.Admin, ProjectRole.Member, ProjectRole.Viewer },
            cancellationToken);

        var query = _context.Issues
            .AsNoTracking()
            .Include(i => i.Type)
            .Include(i => i.Status)
            .Include(i => i.Assignee)
            .Include(i => i.Reporter)
            .Include(i => i.Sprint)
            .Where(i => i.ProjectId == request.ProjectId && i.DeletedAt == null);

        if (request.SprintId.HasValue)
        {
            query = query.Where(i => i.SprintId == request.SprintId.Value);
        }

        var issues = await query
            .OrderBy(i => i.IssueNumber)
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        // Jira-compatible CSV header
        sb.AppendLine("Issue Key,Issue Type,Summary,Description,Status,Priority,Assignee,Reporter,Story Points,Sprint,Created");

        foreach (var issue in issues)
        {
            sb.Append(EscapeCsv(issue.IssueKey)).Append(',');
            sb.Append(EscapeCsv(issue.Type.Name)).Append(',');
            sb.Append(EscapeCsv(issue.Title)).Append(',');
            sb.Append(EscapeCsv(issue.Description ?? "")).Append(',');
            sb.Append(EscapeCsv(issue.Status.Name)).Append(',');
            sb.Append(EscapeCsv(issue.Priority.ToString())).Append(',');
            sb.Append(EscapeCsv(issue.Assignee?.FullName ?? "")).Append(',');
            sb.Append(EscapeCsv(issue.Reporter.FullName)).Append(',');
            sb.Append(EscapeCsv(issue.StoryPoints?.ToString() ?? "")).Append(',');
            sb.Append(EscapeCsv(issue.Sprint?.Name ?? "")).Append(',');
            sb.AppendLine(EscapeCsv(issue.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")));
        }

        // Include UTF-8 BOM so Excel opens Vietnamese characters and special symbols properly
        var preamble = Encoding.UTF8.GetPreamble();
        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var result = new byte[preamble.Length + bytes.Length];
        Buffer.BlockCopy(preamble, 0, result, 0, preamble.Length);
        Buffer.BlockCopy(bytes, 0, result, preamble.Length, bytes.Length);

        return result;
    }

    private static string EscapeCsv(string field)
    {
        if (string.IsNullOrEmpty(field)) return "";
        if (field.Contains(',') || field.Contains('"') || field.Contains('\n') || field.Contains('\r'))
        {
            return $"\"{field.Replace("\"", "\"\"")}\"";
        }
        return field;
    }
}
