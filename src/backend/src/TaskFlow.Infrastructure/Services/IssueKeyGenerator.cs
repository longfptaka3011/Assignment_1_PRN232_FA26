using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public class IssueKeyGenerator : IIssueKeyGenerator
{
    private readonly ApplicationDbContext _context;

    public IssueKeyGenerator(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(int IssueNumber, string IssueKey)> GenerateNextIssueKeyAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var connection = _context.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            await _context.Database.OpenConnectionAsync(cancellationToken);
        }

        await using var command = connection.CreateCommand();
        command.CommandText = @"
            UPDATE public.projects 
            SET issue_counter = issue_counter + 1 
            WHERE id = @projectId AND deleted_at IS NULL 
            RETURNING key, issue_counter;";

        var param = command.CreateParameter();
        param.ParameterName = "@projectId";
        param.Value = projectId;
        command.Parameters.Add(param);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            var projectKey = reader.GetString(0);
            var counter = reader.GetInt32(1);
            return (counter, $"{projectKey}-{counter}");
        }

        throw new NotFoundException("Project", projectId);
    }
}
