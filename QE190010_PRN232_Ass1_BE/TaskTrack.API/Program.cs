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

// Load .env file
var possibleEnvPaths = new[]
{
    Path.Combine(Directory.GetCurrentDirectory(), ".env"),
    Path.Combine(Directory.GetCurrentDirectory(), "..", ".env"),
    Path.Combine(AppContext.BaseDirectory, ".env"),
    Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".env")
};

foreach (var envPath in possibleEnvPaths)
{
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
        break;
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

// Health check endpoint for Render monitoring
app.MapGet("/health", async (TaskTrackDbContext db) =>
{
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        return Results.Ok(new { status = "Healthy", databaseConnected = canConnect, timestamp = DateTime.UtcNow });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { status = "Degraded", databaseError = ex.Message, timestamp = DateTime.UtcNow });
    }
});

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

// Auto-initialize Supabase PostgreSQL tables if not present
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<TaskTrackDbContext>();
    if (await db.Database.CanConnectAsync())
    {
        await db.Database.ExecuteSqlRawAsync(@"
            CREATE SCHEMA IF NOT EXISTS assignment1;

            CREATE TABLE IF NOT EXISTS assignment1.""Department"" (
                ""DepartmentID"" SERIAL PRIMARY KEY,
                ""DepartmentName"" VARCHAR(100) NOT NULL,
                ""DepartmentDescription"" VARCHAR(300) NOT NULL,
                ""IsActive"" BOOLEAN NOT NULL DEFAULT TRUE
            );

            CREATE TABLE IF NOT EXISTS assignment1.""Project"" (
                ""ProjectID"" SERIAL PRIMARY KEY,
                ""ProjectName"" VARCHAR(200) NOT NULL,
                ""Description"" TEXT NULL,
                ""StartDate"" DATE NOT NULL,
                ""EndDate"" DATE NULL,
                ""Status"" SMALLINT NOT NULL DEFAULT 0,
                ""DepartmentID"" INT NOT NULL,
                ""IsActive"" BOOLEAN NOT NULL DEFAULT TRUE,
                ""CreatedDate"" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT ""FK_Project_Department"" FOREIGN KEY (""DepartmentID"")
                    REFERENCES assignment1.""Department"" (""DepartmentID"")
            );

            CREATE TABLE IF NOT EXISTS assignment1.""Tag"" (
                ""TagID"" SERIAL PRIMARY KEY,
                ""TagName"" VARCHAR(50) NOT NULL UNIQUE,
                ""Color"" VARCHAR(7) NULL
            );

            CREATE TABLE IF NOT EXISTS assignment1.""Task"" (
                ""TaskID"" SERIAL PRIMARY KEY,
                ""Title"" VARCHAR(300) NOT NULL,
                ""Description"" TEXT NULL,
                ""Status"" SMALLINT NOT NULL DEFAULT 0,
                ""Priority"" SMALLINT NOT NULL DEFAULT 1,
                ""DueDate"" DATE NULL,
                ""ProjectID"" INT NOT NULL,
                ""IsActive"" BOOLEAN NOT NULL DEFAULT TRUE,
                ""CreatedDate"" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                ""ModifiedDate"" TIMESTAMP WITHOUT TIME ZONE NULL,
                CONSTRAINT ""FK_Task_Project"" FOREIGN KEY (""ProjectID"")
                    REFERENCES assignment1.""Project"" (""ProjectID"")
            );

            CREATE TABLE IF NOT EXISTS assignment1.""TaskTag"" (
                ""TaskID"" INT NOT NULL,
                ""TagID"" INT NOT NULL,
                PRIMARY KEY (""TaskID"", ""TagID""),
                CONSTRAINT ""FK_TaskTag_Task"" FOREIGN KEY (""TaskID"")
                    REFERENCES assignment1.""Task"" (""TaskID"") ON DELETE CASCADE,
                CONSTRAINT ""FK_TaskTag_Tag"" FOREIGN KEY (""TagID"")
                    REFERENCES assignment1.""Tag"" (""TagID"") ON DELETE CASCADE
            );
        ");

        if (!await db.Departments.AnyAsync())
        {
            await db.Database.ExecuteSqlRawAsync(@"
                INSERT INTO assignment1.""Department"" (""DepartmentName"", ""DepartmentDescription"", ""IsActive"") VALUES
                ('Engineering & Technology', 'Software development, infrastructure, and core engineering operations.', TRUE),
                ('Product & Design', 'Product lifecycle management, UI/UX research, and user interaction design.', TRUE),
                ('Quality Assurance & DevOps', 'Automated testing, continuous integration, cloud pipelines, and security.', TRUE),
                ('Business Operations', 'Strategic business development, market expansion, and partnerships.', TRUE);

                INSERT INTO assignment1.""Project"" (""ProjectName"", ""Description"", ""StartDate"", ""EndDate"", ""Status"", ""DepartmentID"", ""IsActive"", ""CreatedDate"") VALUES
                ('TaskTrack Cloud Platform', 'Modern enterprise task & team workflow management solution built on .NET 10 & React.', '2026-09-01', '2026-12-31', 1, 1, TRUE, CURRENT_TIMESTAMP),
                ('NextGen Design System', 'Comprehensive UI token library and responsive components with glassmorphism aesthetics.', '2026-09-15', '2026-11-30', 1, 2, TRUE, CURRENT_TIMESTAMP),
                ('Automated CI/CD Pipeline', 'GitHub Actions workflow integration with Dockerized deployment to cloud platforms.', '2026-10-01', '2026-10-25', 2, 3, TRUE, CURRENT_TIMESTAMP),
                ('Enterprise Security Audit', 'Database encryption, Supabase RLS policies verification, and vulnerability scanning.', '2026-10-10', '2026-11-15', 0, 3, TRUE, CURRENT_TIMESTAMP);

                INSERT INTO assignment1.""Tag"" (""TagName"", ""Color"") VALUES
                ('Frontend', '#3B82F6'),
                ('Backend', '#10B981'),
                ('Database', '#8B5CF6'),
                ('DevOps', '#F59E0B'),
                ('Bug', '#EF4444'),
                ('Feature', '#6366F1'),
                ('High Priority', '#EC4899');

                INSERT INTO assignment1.""Task"" (""Title"", ""Description"", ""Status"", ""Priority"", ""DueDate"", ""ProjectID"", ""IsActive"", ""CreatedDate"") VALUES
                ('Setup PostgreSQL Database Schema', 'Design normalized relational tables and apply constraints in assignment1 schema on Supabase.', 2, 3, '2026-09-05', 1, TRUE, CURRENT_TIMESTAMP),
                ('Implement 3-Tier Layered Architecture', 'Build Controllers, Services, and Repositories with EF Core 10 Database-First approach.', 2, 2, '2026-09-12', 1, TRUE, CURRENT_TIMESTAMP),
                ('Develop React 19 Frontend SPA', 'Construct responsive dashboard, navigation sidebar, and CRUD modals with Lucide icons.', 1, 2, '2026-10-15', 1, TRUE, CURRENT_TIMESTAMP),
                ('Configure Supabase Connection & Pooler', 'Integrate Npgsql connection string with SSL Require and verify CRUD operations.', 1, 3, '2026-10-18', 1, TRUE, CURRENT_TIMESTAMP),
                ('Design Component Tokens & Theme', 'Implement dark/light themes and modern color palette in design-tokens.json.', 2, 1, '2026-09-20', 2, TRUE, CURRENT_TIMESTAMP),
                ('Build GitHub Actions CI Pipeline', 'Automate .NET 10 compilation, npm test, and oxlint validation on pull requests.', 2, 2, '2026-10-05', 3, TRUE, CURRENT_TIMESTAMP),
                ('Conduct Penetration & SQL Injection Test', 'Verify parameterized queries in EF Core to ensure absolute data security.', 0, 1, '2026-11-01', 4, TRUE, CURRENT_TIMESTAMP);

                INSERT INTO assignment1.""TaskTag"" (""TaskID"", ""TagID"") VALUES
                (1, 3), (2, 2), (2, 6), (3, 1), (3, 6), (4, 2), (4, 3), (4, 7), (5, 1), (6, 4), (7, 2), (7, 7);
            ");
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"[Startup DB Auto-Init Notice] {ex.Message}");
}

app.Run();

