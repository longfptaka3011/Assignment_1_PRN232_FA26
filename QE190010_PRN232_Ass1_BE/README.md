# TaskTrack API - Backend

ASP.NET Core Web API for the Task & Team Management Application.

## 🛠️ Tech Stack

- **.NET 10** - Web API Framework
- **Entity Framework Core** - ORM
- **PostgreSQL** - Database (via Npgsql)
- **Swagger/OpenAPI** - API Documentation

## 📁 Project Structure

```
QE190010_PRN232_Ass1_BE/
├── TaskTrack.API/              # Controllers, Program.cs, appsettings.json
│   ├── Controllers/            # API Controllers
│   ├── Program.cs               # Application entry point & configuration
│   └── appsettings.json         # Configuration files
│
├── TaskTrack.Repo/              # Repository Layer
│   ├── Models/                  # EF Core Entities (Database-First)
│   ├── Data/                    # DbContext
│   ├── Repositories/            # Repository implementations
│   └── Interfaces/              # Repository interfaces
│
├── TaskTrack.Service/           # Service Layer
│   ├── Interfaces/             # Service interfaces
│   └── Services/                # Service implementations
│
├── ERD.svg                      # Entity Relationship Diagram
├── Dockerfile                   # Docker configuration
└── QE190010_PRN232_Ass1_BE.sln # Solution file
```

## 🔗 Entity Relationship Diagram

```mermaid
erDiagram
    Department ||--o{ Project : "has"
    Project ||--o{ Task : "contains"
    Task ||--o{ TaskTag : "assigned"
    Tag ||--o{ TaskTag : "belongs to"

    Department {
        int DepartmentID PK "SERIAL"
        varchar(100) DepartmentName "NOT NULL"
        varchar(300) DepartmentDescription "NOT NULL"
        boolean IsActive "DEFAULT TRUE"
    }

    Project {
        int ProjectID PK "SERIAL"
        varchar(200) ProjectName "NOT NULL"
        text Description "NULL"
        date StartDate "NOT NULL"
        date EndDate "NULL"
        smallint Status "0=Not Started, 1=In Progress, 2=Completed, 3=On Hold"
        int DepartmentID FK "REFERENCES Department(DepartmentID)"
        boolean IsActive "DEFAULT TRUE"
        timestamp CreatedDate "DEFAULT CURRENT_TIMESTAMP"
    }

    Task {
        int TaskID PK "SERIAL"
        varchar(300) Title "NOT NULL"
        text Description "NULL"
        smallint Status "0=To Do, 1=In Progress, 2=Done, 3=Cancelled"
        smallint Priority "0=Low, 1=Medium, 2=High, 3=Critical"
        date DueDate "NULL"
        int ProjectID FK "REFERENCES Project(ProjectID)"
        boolean IsActive "DEFAULT TRUE"
        timestamp CreatedDate "DEFAULT CURRENT_TIMESTAMP"
        timestamp ModifiedDate "NULL"
    }

    Tag {
        int TagID PK "SERIAL"
        varchar(50) TagName "NOT NULL UNIQUE"
        varchar(7) Color "Hex code e.g. #3B82F6"
    }

    TaskTag {
        int TaskID PK,FK "REFERENCES Task(TaskID)"
        int TagID PK,FK "REFERENCES Tag(TagID)"
    }
```

### Database Schema

| Table | Description | Key Fields |
|-------|-------------|------------|
| **Department** | Organization departments | DepartmentID (PK), DepartmentName, IsActive |
| **Project** | Projects belonging to departments | ProjectID (PK), DepartmentID (FK), Status, IsActive |
| **Task** | Tasks belonging to projects | TaskID (PK), ProjectID (FK), Status, Priority, IsActive |
| **Tag** | Task tags | TagID (PK), TagName, Color |
| **TaskTag** | Junction table for Task-Tag relationship | TaskID (FK), TagID (FK) |

### Enums

**Project Status:**
- `0` = Not Started
- `1` = In Progress
- `2` = Completed
- `3` = On Hold

**Task Status:**
- `0` = To Do
- `1` = In Progress
- `2` = Done
- `3` = Cancelled

**Task Priority:**
- `0` = Low
- `1` = Medium
- `2` = High
- `3` = Critical

## 🚀 Getting Started

### Prerequisites
- .NET 10 SDK
- PostgreSQL database

### Configuration

Create a `.env` file in the project root:

```env
ASPNETCORE_ENVIRONMENT=Development
DATABASE_HOST=your-postgres-host
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USERNAME=your-username
DATABASE_PASSWORD=your-password
```

Or use `DATABASE_URL` (Render format):
```env
DATABASE_URL=postgres://user:password@host:5432/database
```

### Running the API

```bash
cd TaskTrack.API
dotnet run --urls="http://localhost:5000"
```

### API Documentation

When running, Swagger UI is available at:
- `http://localhost:5000/swagger`

## 📦 NuGet Packages

- `Microsoft.EntityFrameworkCore` - ORM
- `Npgsql.EntityFrameworkCore.PostgreSQL` - PostgreSQL provider
- `Microsoft.EntityFrameworkCore.Design` - EF Core tools
- `Swashbuckle.AspNetCore` - Swagger/OpenAPI

## 🔒 CORS Configuration

CORS is configured to allow all origins for development. In production, update `Program.cs`:

```csharp
options.AddPolicy("AllowVercel", policy =>
{
    policy.WithOrigins("https://your-vercel-frontend.vercel.app")
          .AllowAnyHeader()
          .AllowAnyMethod();
});
```

## 📝 Database Setup

### Database-First Approach

To scaffold entities from existing database:

```bash
dotnet ef dbcontext scaffold "<connection-string>" Npgsql.EntityFrameworkCore.PostgreSQL -o Models
```

### Seed Data

Run the provided `TaskManagementDB_Postgres.sql` script to create tables and seed initial data.

## 🌐 Deployment

### Render.com

1. Push to GitHub
2. Create Web Service on Render
3. Add environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `ASPNETCORE_ENVIRONMENT=Production`
4. Deploy from GitHub branch

### Docker

```bash
docker build -t tasktrack-api .
docker run -p 5000:5000 -e DATABASE_URL="your-connection-string" tasktrack-api
```

## ✅ API Endpoints

| Resource | Endpoints |
|----------|-----------|
| Departments | GET, POST, PUT, DELETE `/api/departments` |
| Projects | GET, POST, PUT, DELETE `/api/projects` |
| Tasks | GET, POST, PUT, DELETE `/api/tasks` |
| Tags | GET, POST, PUT, DELETE `/api/tags` |

See full API documentation at `/swagger` when running.

## 👥 Student Information
- **Full Name**: Trần Nguyễn Bảo Long
- **Student ID**: QE190010
- **GitHub**: longfptaka3011
- **Course**: PRN232 - Advanced Cross-Platform Application Programming with .NET

## 📄 License

Educational use only - PRN232 Assignment 1
