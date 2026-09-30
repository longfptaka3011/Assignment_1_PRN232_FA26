using FluentAssertions;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Features.IssueLinks.Commands.CreateIssueLink;
using TaskFlow.Domain.Enums;
using Xunit;

namespace TaskFlow.Application.UnitTests;

public class IssueLinksTests
{
    [Fact]
    public void Validator_WhenSourceAndTargetAreSame_HasValidationError()
    {
        // Arrange
        var validator = new CreateIssueLinkCommandValidator();
        var sameId = Guid.NewGuid();
        var command = new CreateIssueLinkCommand
        {
            SourceIssueId = sameId,
            TargetIssueId = sameId,
            LinkType = IssueLinkType.RelatesTo
        };

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("cannot be linked to itself"));
    }

    [Fact]
    public void Validator_WhenSourceAndTargetAreDifferent_PassesValidation()
    {
        // Arrange
        var validator = new CreateIssueLinkCommandValidator();
        var command = new CreateIssueLinkCommand
        {
            SourceIssueId = Guid.NewGuid(),
            TargetIssueId = Guid.NewGuid(),
            LinkType = IssueLinkType.Blocks
        };

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }
}
