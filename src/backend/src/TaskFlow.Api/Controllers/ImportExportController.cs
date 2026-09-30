using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Features.ImportExport.Commands.ImportIssuesCsv;
using TaskFlow.Application.Features.ImportExport.Queries.ExportIssuesCsv;

namespace TaskFlow.Api.Controllers;

[Authorize]
public class ImportExportController : ApiControllerBase
{
    [HttpGet("/api/v1/projects/{projectId:guid}/export-csv")]
    public async Task<IActionResult> ExportCsv(
        Guid projectId,
        [FromQuery] Guid? sprintId,
        CancellationToken cancellationToken)
    {
        var csvBytes = await Mediator.Send(new ExportIssuesCsvQuery(projectId, sprintId), cancellationToken);
        var filename = $"project-{projectId}-issues-{DateTime.UtcNow:yyyyMMddHHmmss}.csv";
        return File(csvBytes, "text/csv; charset=utf-8", filename);
    }

    [HttpPost("/api/v1/projects/{projectId:guid}/import-csv")]
    [Authorize(Policy = "RequireProjectMember")]
    public async Task<ActionResult<ImportResultDto>> ImportCsv(
        Guid projectId,
        [FromBody] ImportCsvRequest request,
        CancellationToken cancellationToken)
    {
        var command = new ImportIssuesCsvCommand
        {
            ProjectId = projectId,
            CsvContent = request.CsvContent
        };

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }
}

public class ImportCsvRequest
{
    public string CsvContent { get; set; } = string.Empty;
}
