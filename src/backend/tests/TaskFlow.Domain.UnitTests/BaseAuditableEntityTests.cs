using TaskFlow.Domain.Entities;
using Xunit;

namespace TaskFlow.Domain.UnitTests;

public class BaseAuditableEntityTests
{
    [Fact]
    public void MarkDeleted_ShouldSetDeletedAtAndIsDeletedTrue()
    {
        // Arrange
        var project = new Project
        {
            Id = Guid.NewGuid(),
            Name = "Test Project"
        };

        // Act
        project.MarkDeleted();

        // Assert
        Assert.True(project.IsDeleted);
        Assert.NotNull(project.DeletedAt);
    }

    [Fact]
    public void Restore_ShouldClearDeletedAtAndIsDeletedFalse()
    {
        // Arrange
        var project = new Project
        {
            Id = Guid.NewGuid(),
            Name = "Test Project"
        };
        project.MarkDeleted();

        // Act
        project.Restore();

        // Assert
        Assert.False(project.IsDeleted);
        Assert.Null(project.DeletedAt);
    }
}
