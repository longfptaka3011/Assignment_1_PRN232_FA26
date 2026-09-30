using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;
using Xunit;

namespace TaskFlow.Domain.UnitTests;

public class SprintTests
{
    [Fact]
    public void Start_WhenSprintIsPlanned_ShouldTransitionToActive()
    {
        // Arrange
        var sprint = new Sprint
        {
            Id = Guid.NewGuid(),
            Name = "Sprint 1",
            Status = SprintStatus.Planned
        };

        var startDate = DateTime.UtcNow;
        var endDate = startDate.AddDays(14);

        // Act
        sprint.Start(startDate, endDate);

        // Assert
        Assert.Equal(SprintStatus.Active, sprint.Status);
        Assert.Equal(startDate, sprint.StartDate);
        Assert.Equal(endDate, sprint.EndDate);
    }

    [Fact]
    public void Start_WhenSprintIsNotPlanned_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var sprint = new Sprint
        {
            Id = Guid.NewGuid(),
            Name = "Sprint 1",
            Status = SprintStatus.Active
        };

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => sprint.Start(DateTime.UtcNow, DateTime.UtcNow.AddDays(7)));
    }

    [Fact]
    public void Complete_WhenSprintIsActive_ShouldTransitionToCompleted()
    {
        // Arrange
        var sprint = new Sprint
        {
            Id = Guid.NewGuid(),
            Name = "Sprint 1",
            Status = SprintStatus.Active,
            StartDate = DateTime.UtcNow.AddDays(-14),
            EndDate = DateTime.UtcNow
        };

        // Act
        sprint.Complete();

        // Assert
        Assert.Equal(SprintStatus.Completed, sprint.Status);
        Assert.NotNull(sprint.CompletedAt);
    }

    [Fact]
    public void Complete_WhenSprintIsPlanned_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var sprint = new Sprint
        {
            Id = Guid.NewGuid(),
            Name = "Sprint 1",
            Status = SprintStatus.Planned
        };

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => sprint.Complete());
    }
}
