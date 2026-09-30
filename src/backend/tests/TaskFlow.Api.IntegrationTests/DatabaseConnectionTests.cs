using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TaskFlow.Application.Common.Interfaces;
using Xunit;

namespace TaskFlow.Api.IntegrationTests;

public class DatabaseConnectionTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public DatabaseConnectionTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CanConnectToSupabase_AndQuerySeededData()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        // Verify connection and query projects
        var projects = await context.Projects.ToListAsync();
        Assert.NotEmpty(projects);

        var firstProject = projects[0];
        Assert.Equal("TF", firstProject.Key);

        // Verify query issues
        var issues = await context.Issues.ToListAsync();
        Assert.NotEmpty(issues);
        Assert.True(issues.Count >= 4);

        // Verify query profiles
        var profiles = await context.Profiles.ToListAsync();
        Assert.NotEmpty(profiles);
        Assert.True(profiles.Count >= 3);
    }
}
