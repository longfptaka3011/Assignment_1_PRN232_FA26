using TaskFlow.Application.Features.Issues.Commands.CreateIssue;
using TaskFlow.Application.Features.Projects.Commands.CreateProject;
using TaskFlow.Application.Features.Sprints.Commands.CreateSprint;
using Xunit;

namespace TaskFlow.Application.UnitTests;

public class ValidationTests
{
    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void CreateProjectCommandValidator_WhenNameIsEmpty_ShouldFail(string name)
    {
        var validator = new CreateProjectCommandValidator();
        var command = new CreateProjectCommand { Name = name, Key = "TF" };

        var result = validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Name");
    }

    [Theory]
    [InlineData("a")]        // lowercase
    [InlineData("taskflow")] // lowercase
    [InlineData("1ABC")]     // starts with digit
    [InlineData("TF-1")]     // contains hyphen
    [InlineData("TOOLONGAKEYTOOLONG")] // over 10 characters
    public void CreateProjectCommandValidator_WhenKeyIsInvalid_ShouldFail(string key)
    {
        var validator = new CreateProjectCommandValidator();
        var command = new CreateProjectCommand { Name = "TaskFlow", Key = key };

        var result = validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Key");
    }

    [Theory]
    [InlineData("TF")]
    [InlineData("PRN232")]
    [InlineData("PROJ")]
    [InlineData("A1")]
    public void CreateProjectCommandValidator_WhenKeyIsValid_ShouldPass(string key)
    {
        var validator = new CreateProjectCommandValidator();
        var command = new CreateProjectCommand { Name = "TaskFlow", Key = key };

        var result = validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateIssueCommandValidator_WhenTitleIsEmpty_ShouldFail()
    {
        var validator = new CreateIssueCommandValidator();
        var command = new CreateIssueCommand
        {
            ProjectId = Guid.NewGuid(),
            TypeId = Guid.NewGuid(),
            Title = ""
        };

        var result = validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Title");
    }

    [Fact]
    public void CreateIssueCommandValidator_WhenStoryPointsNegative_ShouldFail()
    {
        var validator = new CreateIssueCommandValidator();
        var command = new CreateIssueCommand
        {
            ProjectId = Guid.NewGuid(),
            TypeId = Guid.NewGuid(),
            Title = "Implement Feature",
            StoryPoints = -1
        };

        var result = validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "StoryPoints");
    }

    [Fact]
    public void CreateSprintCommandValidator_WhenEndDateBeforeStartDate_ShouldFail()
    {
        var validator = new CreateSprintCommandValidator();
        var now = DateTime.UtcNow;
        var command = new CreateSprintCommand
        {
            ProjectId = Guid.NewGuid(),
            Name = "Sprint 1",
            StartDate = now,
            EndDate = now.AddDays(-1)
        };

        var result = validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "EndDate");
    }
}
