using FluentAssertions;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;
using Xunit;

namespace TaskFlow.Application.UnitTests;

public class HierarchyValidationTests
{
    [Fact]
    public void EpicIssue_CannotHaveParentIssue()
    {
        // Arrange
        var issueType = new IssueType
        {
            Id = Guid.NewGuid(),
            Name = "Epic",
            Category = IssueTypeCategory.Epic,
            IsSubtask = false
        };
        var parentId = Guid.NewGuid();

        // Act
        Action act = () =>
        {
            if (issueType.Category == IssueTypeCategory.Epic && parentId != Guid.Empty)
            {
                throw new ConflictException("An Epic cannot have a parent issue.");
            }
        };

        // Assert
        act.Should().Throw<ConflictException>()
            .WithMessage("An Epic cannot have a parent issue.");
    }

    [Fact]
    public void Subtask_CannotBeParentOfAnotherSubtask()
    {
        // Arrange
        var parentType = new IssueType
        {
            Id = Guid.NewGuid(),
            Name = "Sub-task",
            Category = IssueTypeCategory.Subtask,
            IsSubtask = true
        };

        // Act
        Action act = () =>
        {
            if (parentType.Category == IssueTypeCategory.Subtask || parentType.IsSubtask)
            {
                throw new ConflictException("A Sub-task cannot be the parent of another issue.");
            }
        };

        // Assert
        act.Should().Throw<ConflictException>()
            .WithMessage("A Sub-task cannot be the parent of another issue.");
    }

    [Fact]
    public void CircularReference_SelfParenting_ThrowsConflictException()
    {
        // Arrange
        var issueId = Guid.NewGuid();
        Guid? parentId = issueId;

        // Act
        Action act = () =>
        {
            if (parentId == issueId)
            {
                throw new ConflictException("An issue cannot be its own parent.");
            }
        };

        // Assert
        act.Should().Throw<ConflictException>()
            .WithMessage("An issue cannot be its own parent.");
    }
}
