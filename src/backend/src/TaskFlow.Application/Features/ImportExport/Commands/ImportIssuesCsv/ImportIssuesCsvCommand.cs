using System.Text.RegularExpressions;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Features.ImportExport.Commands.ImportIssuesCsv;

public class ImportResultDto
{
    public int TotalProcessed { get; set; }
    public int ImportedCount { get; set; }
    public List<string> ImportedKeys { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}

public record ImportIssuesCsvCommand : IRequest<ImportResultDto>
{
    public Guid ProjectId { get; init; }
    public string CsvContent { get; init; } = string.Empty;
}

public class ImportIssuesCsvCommandValidator : AbstractValidator<ImportIssuesCsvCommand>
{
    public ImportIssuesCsvCommandValidator()
    {
        RuleFor(v => v.ProjectId).NotEmpty();
        RuleFor(v => v.CsvContent).NotEmpty().WithMessage("CSV content cannot be empty.");
    }
}

public class ImportIssuesCsvCommandHandler : IRequestHandler<ImportIssuesCsvCommand, ImportResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IProjectAuthorizationService _projectAuthService;
    private readonly IIssueKeyGenerator _issueKeyGenerator;

    public ImportIssuesCsvCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IProjectAuthorizationService projectAuthService,
        IIssueKeyGenerator issueKeyGenerator)
    {
        _context = context;
        _currentUserService = currentUserService;
        _projectAuthService = projectAuthService;
        _issueKeyGenerator = issueKeyGenerator;
    }

    public async Task<ImportResultDto> Handle(ImportIssuesCsvCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var project = await _context.Projects
            .Include(p => p.IssueTypes)
            .Include(p => p.IssueStatuses)
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId && p.DeletedAt == null, cancellationToken);

        if (project == null)
        {
            throw new NotFoundException("Project", request.ProjectId);
        }

        await _projectAuthService.EnsureRoleAsync(
            request.ProjectId,
            new[] { ProjectRole.Owner, ProjectRole.Admin, ProjectRole.Member },
            cancellationToken);

        var result = new ImportResultDto();

        var rows = ParseCsv(request.CsvContent);
        if (rows.Count < 2)
        {
            result.Errors.Add("CSV must contain at least a header line and one data row.");
            return result;
        }

        var headers = rows[0].Select(h => h.Trim().ToLowerInvariant()).ToList();
        int summaryIdx = headers.FindIndex(h => h == "summary" || h == "title" || h == "name");
        int typeIdx = headers.FindIndex(h => h == "issue type" || h == "type");
        int descIdx = headers.FindIndex(h => h == "description" || h == "desc");
        int statusIdx = headers.FindIndex(h => h == "status");
        int priorityIdx = headers.FindIndex(h => h == "priority");
        int pointsIdx = headers.FindIndex(h => h == "story points" || h == "points" || h == "estimate");

        if (summaryIdx < 0)
        {
            // Default to first column if no explicit summary column header is found
            summaryIdx = 0;
        }

        var defaultType = project.IssueTypes.FirstOrDefault(t => !t.IsSubtask) ?? project.IssueTypes.First();
        var defaultStatus = project.IssueStatuses.OrderBy(s => s.OrderIndex).FirstOrDefault() ?? project.IssueStatuses.First();

        for (int i = 1; i < rows.Count; i++)
        {
            var row = rows[i];
            result.TotalProcessed++;

            if (row.Count <= summaryIdx || string.IsNullOrWhiteSpace(row[summaryIdx]))
            {
                result.Errors.Add($"Row {i + 1}: Summary / Title is empty. Skipped.");
                continue;
            }

            var summary = row[summaryIdx].Trim();
            var desc = descIdx >= 0 && descIdx < row.Count ? row[descIdx].Trim() : null;

            // Match type
            var type = defaultType;
            if (typeIdx >= 0 && typeIdx < row.Count && !string.IsNullOrWhiteSpace(row[typeIdx]))
            {
                var typeName = row[typeIdx].Trim();
                var matched = project.IssueTypes.FirstOrDefault(t => t.Name.Equals(typeName, StringComparison.OrdinalIgnoreCase));
                if (matched != null) type = matched;
            }

            // Match status
            var status = defaultStatus;
            if (statusIdx >= 0 && statusIdx < row.Count && !string.IsNullOrWhiteSpace(row[statusIdx]))
            {
                var statusName = row[statusIdx].Trim();
                var matched = project.IssueStatuses.FirstOrDefault(s => s.Name.Equals(statusName, StringComparison.OrdinalIgnoreCase));
                if (matched != null) status = matched;
            }

            // Match priority
            var priority = IssuePriority.Medium;
            if (priorityIdx >= 0 && priorityIdx < row.Count && !string.IsNullOrWhiteSpace(row[priorityIdx]))
            {
                if (Enum.TryParse<IssuePriority>(row[priorityIdx].Trim(), true, out var p))
                {
                    priority = p;
                }
            }

            // Match points
            decimal? storyPoints = null;
            if (pointsIdx >= 0 && pointsIdx < row.Count && !string.IsNullOrWhiteSpace(row[pointsIdx]))
            {
                if (decimal.TryParse(row[pointsIdx].Trim(), out var pts))
                {
                    storyPoints = pts;
                }
            }

            // Generate atomic Issue Number & Key
            var (issueNum, issueKey) = await _issueKeyGenerator.GenerateNextIssueKeyAsync(project.Id, cancellationToken);

            var issue = new Issue
            {
                Id = Guid.NewGuid(),
                ProjectId = project.Id,
                IssueNumber = issueNum,
                IssueKey = issueKey,
                Title = summary,
                Description = desc,
                TypeId = type.Id,
                StatusId = status.Id,
                Priority = priority,
                ReporterId = currentUserId.Value,
                StoryPoints = storyPoints,
                Position = $"0|{DateTime.UtcNow.Ticks.ToString("x")}:",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Issues.Add(issue);
            result.ImportedCount++;
            result.ImportedKeys.Add(issueKey);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return result;
    }

    private static List<List<string>> ParseCsv(string csv)
    {
        var result = new List<List<string>>();
        using var reader = new StringReader(csv);
        string? line;

        while ((line = reader.ReadLine()) != null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;

            var row = new List<string>();
            var inQuotes = false;
            var currentField = new System.Text.StringBuilder();

            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];

                if (c == '"')
                {
                    if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                    {
                        currentField.Append('"');
                        i++; // skip escaped quote
                    }
                    else
                    {
                        inQuotes = !inQuotes;
                    }
                }
                else if (c == ',' && !inQuotes)
                {
                    row.Add(currentField.ToString());
                    currentField.Clear();
                }
                else
                {
                    currentField.Append(c);
                }
            }
            row.Add(currentField.ToString());
            result.Add(row);
        }

        return result;
    }
}
