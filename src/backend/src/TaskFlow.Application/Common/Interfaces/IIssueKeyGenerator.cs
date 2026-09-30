namespace TaskFlow.Application.Common.Interfaces;

public interface IIssueKeyGenerator
{
    /// <summary>
    /// Atomically increments the project's issue counter and generates a unique issue key (e.g. TF-1, TF-2).
    /// Safe against race conditions and concurrent requests.
    /// </summary>
    Task<(int IssueNumber, string IssueKey)> GenerateNextIssueKeyAsync(Guid projectId, CancellationToken cancellationToken = default);
}
