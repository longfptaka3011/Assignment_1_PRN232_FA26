using FluentAssertions;
using TaskFlow.Application.Features.SavedFilters.Commands.CreateSavedFilter;
using Xunit;

namespace TaskFlow.Application.UnitTests;

public class SavedFiltersTests
{
    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Validator_WhenNameIsEmpty_FailsValidation(string? name)
    {
        // Arrange
        var validator = new CreateSavedFilterCommandValidator();
        var command = new CreateSavedFilterCommand
        {
            Name = name!,
            FilterQuery = "{\"status\": \"Open\"}"
        };

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateSavedFilterCommand.Name));
    }

    [Fact]
    public void Validator_WhenNameExceeds100Characters_FailsValidation()
    {
        // Arrange
        var validator = new CreateSavedFilterCommandValidator();
        var command = new CreateSavedFilterCommand
        {
            Name = new string('A', 101),
            FilterQuery = "{}"
        };

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("cannot exceed 100 characters"));
    }

    [Fact]
    public void Validator_WhenValidInput_PassesValidation()
    {
        // Arrange
        var validator = new CreateSavedFilterCommandValidator();
        var command = new CreateSavedFilterCommand
        {
            Name = "High Priority Bugs",
            FilterQuery = "{\"priority\": \"High\", \"type\": \"Bug\"}",
            IsFavorite = true
        };

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }
}
