using FluentAssertions;
using TaskFlow.Domain.Entities;
using Xunit;

namespace TaskFlow.Application.UnitTests;

public class IssueWatchersTests
{
    [Fact]
    public void IssueWatcher_InitializesCorrectly()
    {
        // Arrange
        var issueId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        // Act
        var watcher = new IssueWatcher
        {
            IssueId = issueId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        // Assert
        watcher.IssueId.Should().Be(issueId);
        watcher.UserId.Should().Be(userId);
        watcher.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }
}
