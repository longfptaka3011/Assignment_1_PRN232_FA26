# TaskTrack — Task & Team Management System

[![Continuous Integration](https://github.com/longfptaka3011/Assignment_1_PRN232_FA26/actions/workflows/ci.yml/badge.svg)](https://github.com/longfptaka3011/Assignment_1_PRN232_FA26/actions/workflows/ci.yml)
[![.NET Version](https://img.shields.io/badge/.NET-10.0-512BD4?style=flat&logo=dotnet)](https://dotnet.microsoft.com/)
[![React Version](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render)](https://render.com/)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat&logo=vercel)](https://vercel.com/)

> **PRN232 — Advanced Cross-Platform Application Programming with .NET (Assignment 1)**  
> **Student ID**: `QE190010` | **Author**: `Trần Nguyễn Bảo Long` (`longfptaka3011`)

---

## 🌐 Live Production Links

| Resource | URL | Description |
| :--- | :--- | :--- |
| 🚀 **Web Application (Frontend)** | [https://assignment-1-prn-232-fa-26.vercel.app](https://assignment-1-prn-232-fa-26.vercel.app) | Responsive React 19 SPA deployed on Vercel |
| ⚡ **RESTful API Service** | [https://assignment-1-prn232-fa26.onrender.com](https://assignment-1-prn232-fa26.onrender.com) | ASP.NET Core 10 Web API hosted on Render Docker container |
| 📖 **Swagger / OpenAPI UI** | [https://assignment-1-prn232-fa26.onrender.com/swagger](https://assignment-1-prn232-fa26.onrender.com/swagger) | Interactive API exploration and testing interface |
| 🐙 **Source Code (GitHub)** | [https://github.com/longfptaka3011/Assignment_1_PRN232_FA26](https://github.com/longfptaka3011/Assignment_1_PRN232_FA26) | Full-stack monorepo with CI/CD workflows |

---

## 📌 Project Overview

**TaskTrack** is a cross-platform Task & Team Management application designed to streamline project workflows, track task statuses, organize departmental workloads, and categorize activities using dynamic tags.

Built following standard enterprise engineering standards:
- **Backend**: Strict **3-Tier Layered Architecture** (`API` ➔ `Service` ➔ `Repo`) using **ASP.NET Core 10** and **Entity Framework Core 10** with Database-First scaffolding on **PostgreSQL**.
- **Frontend**: Component-driven SPA built with **React 19**, **TypeScript**, **Vite**, **Vanilla CSS Design System (Glassmorphism & Dark/Light modes)**, and **Axios**.
- **DevOps**: Fully automated **GitHub Actions CI**, containerized with **Docker**, deployed on **Render** (API + Managed PostgreSQL) and **Vercel** (SPA Edge Hosting).

---

## 📊 Database Schema & Entity-Relationship Diagram (ERD)

The database follows a normalized relational structure created from [`TaskManagementDB_Postgres (1).sql`](./TaskManagementDB_Postgres%20(1).sql):

```mermaid
erDiagram
    Department ||--o{ Project : "has (1:N)"
    Project ||--o{ Task : "contains (1:N)"
    Task ||--o{ TaskTag : "assigned (1:N)"
    Tag ||--o{ TaskTag : "belongs to (1:N)"

    Department {
        int DepartmentID PK "SERIAL"
        varchar(100) DepartmentName "NOT NULL"
        varchar(300) DepartmentDescription "NOT NULL"
        boolean IsActive "NOT NULL DEFAULT TRUE"
    }

    Project {
        int ProjectID PK "SERIAL"
        varchar(200) ProjectName "NOT NULL"
        text Description "NULL"
        date StartDate "NOT NULL"
        date EndDate "NULL"
        smallint Status "NOT NULL DEFAULT 0 (0:Not Started, 1:In Progress, 2:Completed, 3:On Hold)"
        int DepartmentID FK "NOT NULL REFERENCES Department(DepartmentID)"
        boolean IsActive "NOT NULL DEFAULT TRUE"
        timestamp CreatedDate "NOT NULL DEFAULT CURRENT_TIMESTAMP"
    }

    Task {
        int TaskID PK "SERIAL"
        varchar(300) Title "NOT NULL"
        text Description "NULL"
        smallint Status "NOT NULL DEFAULT 0 (0:To Do, 1:In Progress, 2:Done, 3:Cancelled)"
        smallint Priority "NOT NULL DEFAULT 1 (0:Low, 1:Medium, 2:High, 3:Critical)"
        date DueDate "NULL"
        int ProjectID FK "NOT NULL REFERENCES Project(ProjectID)"
        boolean IsActive "NOT NULL DEFAULT TRUE"
        timestamp CreatedDate "NOT NULL DEFAULT CURRENT_TIMESTAMP"
        timestamp ModifiedDate "NULL"
    }

    Tag {
        int TagID PK "SERIAL"
        varchar(50) TagName "NOT NULL UNIQUE"
        varchar(7) Color "NULL (Hex code e.g. #3B82F6)"
    }

    TaskTag {
        int TaskID PK,FK "REFERENCES Task(TaskID) ON DELETE CASCADE"
        int TagID PK,FK "REFERENCES Tag(TagID) ON DELETE CASCADE"
    }
```

### 📋 Data Dictionary & Enums

#### 1. Status & Priority Enums
| Enum Name | Code | Name / Value | Description |
| :--- | :---: | :--- | :--- |
| **Project Status** | `0` | **Not Started** | Project planned but work hasn't begun |
| | `1` | **In Progress** | Project currently active and underway |
| | `2` | **Completed** | Project finished and delivered |
| | `3` | **On Hold** | Project temporarily paused |
| **Task Status** | `0` | **To Do** | Task pending execution |
| | `1` | **In Progress** | Task currently being worked on |
| | `2` | **Done** | Task completed successfully |
| | `3` | **Cancelled** | Task aborted or no longer required |
| **Task Priority** | `0` | **Low** | Routine tasks with flexible delivery |
| | `1` | **Medium** | Standard priority (default) |
| | `2` | **High** | Important tasks requiring prompt attention |
| | `3` | **Critical** | Urgent blockers requiring immediate action |

#### 2. Business Integrity & Constraints
- **Soft Deletion for Tasks**: When a task is deleted, `IsActive` is set to `FALSE` (never physical row deletion).
- **Referential Integrity for Projects**: A project cannot be deleted if it contains linked tasks (returns `HTTP 400 Bad Request`).
- **Referential Integrity for Departments**: A department cannot be deleted if linked to existing projects (returns `HTTP 400 Bad Request`).
- **Referential Integrity for Tags**: A tag cannot be deleted if assigned to any existing tasks (returns `HTTP 400 Bad Request`).
- **Unique Tag Names**: Duplicate tag names are prevented at database constraint level.

---

## 🏛️ System Architecture

TaskTrack follows a strict **3-Tier Layered Architecture** with unidirectional dependency flow, decoupling presentation, business logic, and data access.

```mermaid
flowchart TD
    subgraph ClientLayer["🖥️ Frontend Client (Vercel Edge)"]
        UI["React 19 SPA (TypeScript + Vite)"]
        Axios["Axios HTTP Client + Interceptors"]
        Context["Theme & Toast State Context"]
        UI --> Context
        UI --> Axios
    end

    subgraph APILayer["⚡ Presentation Layer — TaskTrack.API (Render Docker)"]
        direction TB
        CORS["CORS & Routing Middleware"]
        Swagger["Swagger / OpenAPI Docs"]
        Controllers["API Controllers\n(Tasks, Projects, Departments, Tags)"]
        DI["Dependency Injection Container"]
        CORS --> Controllers
        Swagger -.-> Controllers
        DI -.-> Controllers
    end

    subgraph ServiceLayer["🧠 Business Logic Layer — TaskTrack.Service"]
        direction TB
        Services["Business Services\n(TaskService, ProjectService, DeptService, TagService)"]
        DTOs["Data Transfer Objects (DTOs)\n(Create/Update DTOs, Responses)"]
        Validators["Business Rules & Constraint Validators"]
        Services --> Validators
        Services --> DTOs
    end

    subgraph RepoLayer["💾 Data Access Layer — TaskTrack.Repo"]
        direction TB
        Repos["Repository Layer\n(TaskRepo, ProjectRepo, DepartmentRepo, TagRepo)"]
        DbContext["TaskTrackDbContext (EF Core 10)"]
        Models["EF Core Data Models"]
        Repos --> DbContext
        DbContext --> Models
    end

    subgraph DBLayer["🐘 Database Layer"]
        Postgres[("PostgreSQL 16 Database\n(Tables, Foreign Keys, Indexes, Constraints)")]
    end

    Axios -- "HTTPS / JSON REST" --> CORS
    Controllers -- "Injects & Invokes" --> Services
    Services -- "Queries / Commands" --> Repos
    DbContext -- "Npgsql Provider (SQL)" --> Postgres

    classDef client fill:#3b82f615,stroke:#3b82f6,stroke-width:2px,color:#60a5fa;
    classDef api fill:#8b5cf615,stroke:#8b5cf6,stroke-width:2px,color:#a78bfa;
    classDef service fill:#10b98115,stroke:#10b981,stroke-width:2px,color:#34d399;
    classDef repo fill:#f59e0b15,stroke:#f59e0b,stroke-width:2px,color:#fbbf24;
    classDef db fill:#06b6d415,stroke:#06b6d4,stroke-width:2px,color:#22d3ee;

    class ClientLayer client;
    class APILayer api;
    class ServiceLayer service;
    class RepoLayer repo;
    class DBLayer db;
```

---

## 🔄 Business Workflow & Interaction Diagrams

### 1. Task Lifecycle & State Transitions

Tasks transition through distinct workflow states with soft-deletion support:

```mermaid
stateDiagram-v2
    [*] --> ToDo : Create Task (Default Status = 0)
    ToDo --> InProgress : Start Working (Status = 1)
    InProgress --> ToDo : Move Back
    InProgress --> Done : Complete Task (Status = 2)
    ToDo --> Done : Quick Complete
    Done --> InProgress : Reopen Task
    
    ToDo --> Cancelled : Abort Task (Status = 3)
    InProgress --> Cancelled : Cancel Task
    Cancelled --> ToDo : Reactivate Task

    ToDo --> SoftDeleted : Soft Delete (IsActive = false)
    InProgress --> SoftDeleted : Soft Delete (IsActive = false)
    Done --> SoftDeleted : Soft Delete (IsActive = false)
    Cancelled --> SoftDeleted : Soft Delete (IsActive = false)

    SoftDeleted --> [*]
```

### 2. End-to-End Request & Validation Sequence

Demonstration of business constraint enforcement (e.g., verifying project safety before deletion or assigning tags to a task):

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User / Browser
    participant React as ⚛️ React 19 Client
    participant Controller as 🎮 TaskController
    participant Service as 🧠 TaskService
    participant Repo as 💾 TaskRepository
    participant DB as 🐘 PostgreSQL

    User->>React: Fill form & click "Create Task"
    React->>React: Validate client form inputs
    React->>Controller: POST /api/Tasks (CreateTaskDto + TagIds)
    
    activate Controller
    Controller->>Service: CreateTaskAsync(dto)
    activate Service
    
    Service->>Service: Validate Project exists & active
    Service->>Service: Validate Tag IDs exist
    Service->>Repo: AddAsync(Task Entity)
    activate Repo
    Repo->>DB: INSERT INTO Task (...)
    DB-->>Repo: Return generated TaskID
    
    loop For each TagID
        Repo->>DB: INSERT INTO TaskTag (TaskID, TagID)
    end
    
    Repo-->>Service: Completed Task entity with Tags
    deactivate Repo
    
    Service->>Service: Map Entity ➔ TaskDto
    Service-->>Controller: Return TaskDto
    deactivate Service
    
    Controller-->>React: HTTP 201 Created (JSON Response)
    deactivate Controller
    
    React->>React: Trigger Toast Notification & Update Local State
    React-->>User: Display new Task on Board
```

---

## 🔌 Complete RESTful API Reference

All endpoints return standard JSON envelopes and adhere to REST conventions:

### 1. Tasks API (`/api/Tasks`)
| Method | Endpoint | Description | Query / Body Params | Response |
| :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/Tasks` | Get all active tasks | — | `200 OK` |
| `GET` | `/api/Tasks/search` | Multi-criteria task search | `title`, `status`, `priority`, `projectId`, `tagId` | `200 OK` |
| `GET` | `/api/Tasks/{id}` | Get task details by ID (including assigned tags) | `{id}` (route) | `200 OK` / `404` |
| `GET` | `/api/Tasks/project/{projectId}` | Get all tasks belonging to a specific project | `{projectId}` (route) | `200 OK` |
| `POST` | `/api/Tasks` | Create a new task with optional tag IDs | `CreateTaskDto` | `201 Created` / `400` |
| `PUT` | `/api/Tasks/{id}` | Update task details and replace tag associations | `UpdateTaskDto` | `200 OK` / `400` / `404` |
| `DELETE` | `/api/Tasks/{id}` | Soft-delete a task (`IsActive = false`) | `{id}` (route) | `204 No Content` / `404` |

### 2. Projects API (`/api/Projects`)
| Method | Endpoint | Description | Query / Body Params | Response |
| :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/Projects` | Get all active projects with department info | — | `200 OK` |
| `GET` | `/api/Projects/search` | Filter projects by name, status, or department | `name`, `status`, `departmentId` | `200 OK` |
| `GET` | `/api/Projects/{id}` | Get project details and all associated tasks | `{id}` (route) | `200 OK` / `404` |
| `GET` | `/api/Projects/department/{deptId}` | Get all projects in a department | `{deptId}` (route) | `200 OK` |
| `POST` | `/api/Projects` | Create a new project | `CreateProjectDto` | `201 Created` / `400` |
| `PUT` | `/api/Projects/{id}` | Update project info | `UpdateProjectDto` | `200 OK` / `400` / `404` |
| `DELETE` | `/api/Projects/{id}` | Delete project (allowed only if 0 tasks linked) | `{id}` (route) | `204 No Content` / `400` / `404` |

### 3. Departments API (`/api/Departments`)
| Method | Endpoint | Description | Query / Body Params | Response |
| :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/Departments` | Get all active departments | — | `200 OK` |
| `GET` | `/api/Departments/search` | Search departments by partial name | `name` | `200 OK` |
| `GET` | `/api/Departments/{id}` | Get department details and its projects | `{id}` (route) | `200 OK` / `404` |
| `POST` | `/api/Departments` | Create a new department | `CreateDepartmentDto` | `201 Created` / `400` |
| `PUT` | `/api/Departments/{id}` | Update department info | `UpdateDepartmentDto` | `200 OK` / `400` / `404` |
| `DELETE` | `/api/Departments/{id}` | Delete department (allowed only if 0 projects linked) | `{id}` (route) | `204 No Content` / `400` / `404` |

### 4. Tags API (`/api/Tags`)
| Method | Endpoint | Description | Query / Body Params | Response |
| :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/Tags` | Get all available tags | — | `200 OK` |
| `GET` | `/api/Tags/{id}` | Get tag details by ID | `{id}` (route) | `200 OK` / `404` |
| `POST` | `/api/Tags` | Create a new tag (Hex color format: `#RRGGBB`) | `CreateTagDto` | `201 Created` / `400` |
| `PUT` | `/api/Tags/{id}` | Update tag name or color | `UpdateTagDto` | `200 OK` / `400` / `404` |
| `DELETE` | `/api/Tags/{id}` | Delete tag (allowed only if not assigned to tasks) | `{id}` (route) | `204 No Content` / `400` / `404` |

---

## ✨ Key Features & UI/UX Highlights

- 🎯 **Executive Dashboard**: Real-time summary statistics, status breakdown bars, priority distribution metrics, and upcoming deadlines.
- ⚡ **Interactive Task Board & Table**:
  - Quick Status Filter Pills (`All`, `To Do`, `In Progress`, `Done`, `Cancelled`).
  - Multi-attribute filters (Priority, Project, Tag, Keyword search).
  - Inline status updater with smooth transitions.
  - Due date warning badges (Overdue, Due Soon, On Track).
- 🏷️ **Tag Color Badges**: Visual hex-colored tags dynamically rendered across lists and detail pages.
- 🏢 **Department & Project Hierarchy**: Drill down from Department ➔ Project ➔ Task with deep statistics and completion rates.
- 🔍 **Global Real-Time Search**: Instant search matching across tasks, projects, and departments.
- 🎨 **Modern Design System**:
  - Glassmorphic card surfaces with subtle backdrop filters.
  - Full Dark Mode & Light Mode support.
  - Toast notification system for CRUD feedback and business rule alerts.
  - Fully responsive across Desktop, Tablet, and Mobile viewports.

---

## 💻 Local Development & Setup Guide

### 1. Prerequisites
- **.NET 10.0 SDK** (or .NET 9.0+)
- **Node.js 20+** & **npm**
- **PostgreSQL 14+** (Local service or Cloud PostgreSQL e.g., Neon / Supabase)

---

### 2. Database Initialization
Execute [`TaskManagementDB_Postgres (1).sql`](./TaskManagementDB_Postgres%20(1).sql) in PostgreSQL using `psql` or pgAdmin / DBeaver:
```bash
psql -U postgres -d postgres -f "TaskManagementDB_Postgres (1).sql"
```

---

### 3. Backend Setup (`QE190010_PRN232_Ass1_BE`)

1. Navigate to the backend directory:
   ```bash
   cd QE190010_PRN232_Ass1_BE
   ```

2. Configure environment variables in `.env` (or `appsettings.json`):
   ```env
   ASPNETCORE_ENVIRONMENT=Development
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=TaskManagementDB
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=your_password
   ```

3. Restore packages & run the API:
   ```bash
   dotnet restore
   dotnet run --project TaskTrack.API --urls="http://localhost:5000"
   ```
   - API Endpoint: `http://localhost:5000`
   - Swagger Documentation: `http://localhost:5000/swagger`

---

### 4. Frontend Setup (`QE190010_PRN232_Ass1_FE`)

1. Navigate to the frontend directory:
   ```bash
   cd QE190010_PRN232_Ass1_FE
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure `.env.local`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. Launch Vite development server:
   ```bash
   npm run dev
   ```
   - Frontend Application: `http://localhost:5173`

---

## 🚀 Deployment Architecture & CI/CD Pipeline

```mermaid
flowchart LR
    Dev["👨‍💻 Developer\n(Git Push / PR)"] --> GitHub["🐙 GitHub Monorepo\n(Assignment-1_PRN232_Fa26)"]
    
    subgraph CI["⚙️ GitHub Actions CI"]
        direction TB
        BE_Build[".NET 10 SDK\nRestore & Build Solution"]
        FE_Build["Node.js 20\nTypecheck & Vite Build"]
        BE_Build --- FE_Build
    end

    GitHub --> CI

    subgraph CD_BE["🐳 Backend (Render Cloud)"]
        direction TB
        DockerBuild["Multi-Stage Dockerfile\n(ASP.NET 10 Runtime)"]
        RenderService["Render Web Service\n(Auto Port Binding)"]
        PostgresDB[("PostgreSQL 16\nManaged Database")]
        DockerBuild --> RenderService
        RenderService --> PostgresDB
    end

    subgraph CD_FE["⚡ Frontend (Vercel Edge)"]
        direction TB
        ViteBuild["Vite Static Output\n(dist/ + vercel.json)"]
        VercelEdge["Vercel Global Edge CDN\n(SPA Rewrites)"]
        ViteBuild --> VercelEdge
    end

    CI -- "Render Deploy Hook" --> DockerBuild
    CI -- "Vercel GitHub Integration" --> ViteBuild
    
    VercelEdge -- "HTTPS / CORS REST API" --> RenderService

    classDef dev fill:#f8717115,stroke:#ef4444,stroke-width:2px,color:#f87171;
    classDef gh fill:#818cf815,stroke:#6366f1,stroke-width:2px,color:#818cf8;
    classDef be fill:#34d39915,stroke:#10b981,stroke-width:2px,color:#34d399;
    classDef fe fill:#38bdf815,stroke:#0ea5e9,stroke-width:2px,color:#38bdf8;

    class Dev dev;
    class GitHub,CI gh;
    class CD_BE be;
    class CD_FE fe;
```

### 1. Backend on Render (Docker Web Service)
- **Containerization**: Multi-stage `Dockerfile` targeting `.NET 10` ASP.NET runtime.
- **Port Binding**: Automatically binds to `$PORT` exported by Render.
- **Database Connection**: Set `DATABASE_URL` as an environment secret pointing to PostgreSQL.

### 2. Frontend on Vercel (Edge SPA)
- **Build Engine**: `npm run build` producing optimized static bundles in `dist/`.
- **Client Routing**: Configured with `vercel.json` rewrite rule to route all paths to `index.html`.
- **API Proxy/Env**: `VITE_API_URL=https://assignment-1-prn232-fa26.onrender.com/api`.

---

## 📂 Project Directory Structure

```
.
├── .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions CI Workflow
├── QE190010_PRN232_Ass1_BE/           # Backend Solution (3-Tier Layered)
│   ├── TaskTrack.API/                 # Presentation Layer
│   │   ├── Controllers/               # Tasks, Projects, Departments, Tags Controllers
│   │   ├── Program.cs                 # App Startup, DI, Swagger, CORS
│   │   └── appsettings.json           # Configuration
│   ├── TaskTrack.Service/             # Business Logic Layer
│   │   ├── DTOs/                      # Request / Response Transfer Objects
│   │   ├── Interfaces/                # Service Contracts
│   │   └── Services/                  # Business Logic & Validation
│   ├── TaskTrack.Repo/                # Data Access Layer
│   │   ├── Data/                      # TaskTrackDbContext
│   │   ├── Models/                    # Database-First EF Core Entities
│   │   ├── Interfaces/                # Repository Contracts
│   │   └── Repositories/              # Generic & Specific Repositories
│   ├── Dockerfile                     # Containerization Configuration
│   └── QE190010_PRN232_Ass1_BE.sln    # .NET Solution File
├── QE190010_PRN232_Ass1_FE/           # Frontend Application (React 19 SPA)
│   ├── src/
│   │   ├── components/                # Navbar, Layout, Cards, Modals, Badges
│   │   ├── context/                   # ThemeContext, ToastContext
│   │   ├── pages/                     # Dashboard, TaskList, ProjectList, DeptList, TagList
│   │   ├── services/                  # Axios API Clients
│   │   ├── styles/                    # Global CSS Tokens & Variables
│   │   └── types/                     # TypeScript Interface Definitions
│   ├── package.json                   # Dependencies & Scripts
│   ├── vercel.json                    # SPA Routing Config for Vercel
│   └── vite.config.ts                 # Vite Build Configuration
├── TaskManagementDB_Postgres (1).sql   # PostgreSQL Database Creation & Seed Script
└── README.md                          # Comprehensive Documentation
```

---

## 🛡️ License & Academic Integrity

Developed for **PRN232 Practical Exam / Assignment 1** by **QE190010**.  
Distributed for academic assessment and learning purposes.
