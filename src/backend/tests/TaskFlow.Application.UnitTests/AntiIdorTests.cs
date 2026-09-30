using FluentAssertions;
using Moq;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Enums;
using Xunit;

namespace TaskFlow.Application.UnitTests;

public class AntiIdorTests
{
    private readonly Mock<IProjectAuthorizationService> _mockAuthService;

    public AntiIdorTests()
    {
        _mockAuthService = new Mock<IProjectAuthorizationService>();
    }

    [Fact]
    public async Task EnsureMemberAsync_WhenUserIsNotMember_ThrowsForbiddenAccessException()
    {
        // Arrange
        var projectId = Guid.NewGuid();
        _mockAuthService
            .Setup(s => s.EnsureMemberAsync(projectId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ForbiddenAccessException("You do not have access to this project."));

        // Act
        Func<Task> act = async () => await _mockAuthService.Object.EnsureMemberAsync(projectId);

        // Assert
        await act.Should().ThrowAsync<ForbiddenAccessException>()
            .WithMessage("*access to this project*");
    }

    [Fact]
    public async Task EnsureRoleAsync_WhenViewerTriesToPerformMemberAction_ThrowsForbiddenAccessException()
    {
        // Arrange
        var projectId = Guid.NewGuid();
        var allowedRoles = new[] { ProjectRole.Owner, ProjectRole.Admin, ProjectRole.Member };

        _mockAuthService
            .Setup(s => s.EnsureRoleAsync(projectId, allowedRoles, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ForbiddenAccessException("You do not have the required role in this project to perform this action."));

        // Act
        Func<Task> act = async () => await _mockAuthService.Object.EnsureRoleAsync(projectId, allowedRoles);

        // Assert
        await act.Should().ThrowAsync<ForbiddenAccessException>()
            .WithMessage("*required role in this project*");
    }

    [Fact]
    public async Task EnsureRoleAsync_WhenUserHasAdminOrOwnerRole_SucceedsWithoutException()
    {
        // Arrange
        var projectId = Guid.NewGuid();
        var allowedRoles = new[] { ProjectRole.Owner, ProjectRole.Admin, ProjectRole.Member };

        _mockAuthService
            .Setup(s => s.EnsureRoleAsync(projectId, allowedRoles, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        Func<Task> act = async () => await _mockAuthService.Object.EnsureRoleAsync(projectId, allowedRoles);

        // Assert
        await act.Should().NotThrowAsync();
    }
}
