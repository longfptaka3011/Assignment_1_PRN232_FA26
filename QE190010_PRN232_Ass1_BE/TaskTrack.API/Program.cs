using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Npgsql;
using TaskTrack.Repo.Models;
using TaskTrack.Repo.Repositories;
using TaskTrack.Service.Services;

// Enable Npgsql legacy timestamp behavior for compatibility with 'timestamp without time zone'
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Load .env file in Development
if (builder.Environment.IsDevelopment())
{
    var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", ".env");
    if (File.Exists(envPath))
    {
        foreach (var line in File.ReadAllLines(envPath))
        {
            var parts = line.Split('=', 2);
            if (parts.Length == 2 && !string.IsNullOrWhiteSpace(parts[0]) && !parts[0].StartsWith("#"))
            {
                Environment.SetEnvironmentVariable(parts[0].Trim(), parts[1].Trim());
            }
        }
    }
}

// Configure PostgreSQL Connection String (supports Render DATABASE_URL or individual env vars)
string? connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");

if (!string.IsNullOrEmpty(connectionString) && (connectionString.StartsWith("postgres://") || connectionString.StartsWith("postgresql://")))
{
    // Parse DATABASE_URL (Render format)
    var uri = new Uri(connectionString);
    var userInfo = uri.UserInfo.Split(':');
    var npgsqlBuilder = new NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port > 0 ? uri.Port : 5432,
        Username = userInfo.Length > 0 ? userInfo[0] : "",
        Password = userInfo.Length > 1 ? userInfo[1] : "",
        Database = uri.AbsolutePath.TrimStart('/'),
        SslMode = SslMode.Require
    };
    connectionString = npgsqlBuilder.ToString();
}
else
{
    // Build from individual env vars or use appsettings.json
    var host = Environment.GetEnvironmentVariable("DATABASE_HOST");
    if (!string.IsNullOrEmpty(host))
    {
        var npgsqlBuilder = new NpgsqlConnectionStringBuilder
        {
            Host = host,
            Port = int.TryParse(Environment.GetEnvironmentVariable("DATABASE_PORT"), out var port) ? port : 5432,
            Username = Environment.GetEnvironmentVariable("DATABASE_USERNAME") ?? "",
            Password = Environment.GetEnvironmentVariable("DATABASE_PASSWORD") ?? "",
            Database = Environment.GetEnvironmentVariable("DATABASE_NAME") ?? "postgres",
            SslMode = SslMode.Require
        };
        connectionString = npgsqlBuilder.ToString();
    }
    else
    {
        connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    }
}

builder.Services.AddDbContext<TaskTrackDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

// 2. Register Repositories
builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();
builder.Services.AddScoped<IProjectRepository, ProjectRepository>();
builder.Services.AddScoped<ITaskRepository, TaskRepository>();
builder.Services.AddScoped<ITagRepository, TagRepository>();

// 3. Register Services
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<ITagService, TagService>();

// 4. Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 5. Configure Controllers & JSON Options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// 6. Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TaskTrack API - PRN232 Assignment 1",
        Version = "v1",
        Description = "Task & Team Management Web API built with ASP.NET Core & PostgreSQL (EF Core DB-First)"
    });
});

var app = builder.Build();

// 7. Configure HTTP Request Pipeline
// Enable Swagger in Development and Production for online testing / evaluation
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "TaskTrack API v1");
    c.RoutePrefix = "swagger"; // Available at /swagger
});

// Redirect root / to /swagger for easy access
app.MapGet("/", () => Results.Redirect("/swagger"));

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.Run();

