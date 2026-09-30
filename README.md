# TaskFlow 🚀

> **Agile & Kanban Project Management System** built with **Clean Architecture (.NET 8)**, **CQRS (MediatR)**, **Supabase (PostgreSQL & Storage)**, and **JWT Bearer Authentication**.

---

## 🏗️ Architecture Overview

The solution adheres strictly to **Clean Architecture** and **Domain-Driven Design (DDD)** principles:

```
TaskFlow/
├── supabase/
│   ├── migrations/
│   │   └── 20260930000000_initial_schema.sql  # Complete PostgreSQL DDL & Auth trigger
│   └── seed.sql                               # Demo development data
└── src/
    └── backend/
        ├── TaskFlow.slnx                      # Modern Solution File
        ├── src/
        │   ├── TaskFlow.Domain/               # Core Entities, Enums, Aggregate Roots
        │   ├── TaskFlow.Application/          # CQRS Commands, Queries, Validators, DTOs
        │   ├── TaskFlow.Infrastructure/       # EF Core, PostgreSQL Npgsql, Interceptors, Supabase Storage
        │   └── TaskFlow.Api/                  # REST API Controllers, Policies, Middleware, Swagger
        └── tests/
            ├── TaskFlow.Domain.UnitTests/     # Domain state transitions & entity tests
            ├── TaskFlow.Application.UnitTests/ # Validator tests, LexoRank algorithm tests
            └── TaskFlow.Api.IntegrationTests/ # WebApplicationFactory integration tests
```

---

## ⚡ Core Features Implemented

### 1. Projects & Workspace Management
- **Create Project**: Auto-provisions project creator as `Owner`, auto-seeds standard `IssueTypes` (Epic, Story, Task, Bug, Subtask), standard `IssueStatuses` (Backlog, To Do, In Progress, In Review, Done), and default `Labels`.
- **Project Role Authorization**: Fine-grained project authorization with custom policies (`RequireProjectOwner`, `RequireProjectAdmin`, `RequireProjectMember`, `RequireProjectViewer`).
- **Member Management**: Add member by email, role assignments (`Owner`, `Admin`, `Member`, `Viewer`), member removal with safety checks preventing lead demotion.
- **Soft Deletion & Archival**: Global query filters (`deleted_at IS NULL`) for non-destructive data management.

### 2. Issues & Real-Time Kanban Board
- **Atomic Key Generation**: High-performance PostgreSQL atomic sequence increment (`TF-1`, `TF-2`, ...).
- **LexoRank Drag-and-Drop Ordering**: Fractional string indexing (`0|hzzzzz:`) allowing cards to be rearranged and dropped between any two cards without reindexing entire columns.
- **Optimistic Concurrency Control**: Uses PostgreSQL `RowVersion` (`xmin`) to prevent conflicting concurrent drag-and-drop operations.
- **Filtering & Pagination**: Multi-criteria issue search (project, sprint, status, assignee, priority, text query, subtask hierarchy).

### 3. Sprint Planning & Scrum Workflow
- **Sprint Lifecycle**: Planned ➔ Active ➔ Completed.
- **Single Active Sprint Rule**: Prevents concurrent sprint collision per project.
- **Sprint Completion Migration**: Automatically transfers uncompleted issues to the next sprint or back to the project Backlog.
- **Burndown / Velocity Metrics**: Aggregates total and completed story points per sprint.

### 4. Collaboration & Audit Trail
- **Threaded Comments**: Issue discussion with Markdown support and automated notification dispatch.
- **Activity Logging**: Automatically captures audit records on issue creation, edits, assignee reassignments, sprint moves, and deletions.
- **Supabase Storage Attachments**: Pre-signed URLs for secure direct file access and upload management.
- **Notification System**: Notifications for mentions, assignments, sprint changes, and comments with mark-as-read workflows.

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description | Auth Policy |
|--------|----------|-------------|-------------|
| **Profiles** | | | |
| `GET` | `/api/v1/profiles/me` | Current user profile (auto-provisions on 1st login) | Authorized |
| `PUT` | `/api/v1/profiles/me` | Update name and avatar | Authorized |
| `GET` | `/api/v1/profiles/search?query=` | Search users by name/email | Authorized |
| **Projects** | | | |
| `GET` | `/api/v1/projects` | List projects user belongs to | Authorized |
| `POST` | `/api/v1/projects` | Create a new project (auto-seeds defaults) | Authorized |
| `GET` | `/api/v1/projects/{id}` | Get project details by ID | Project Member |
| `GET` | `/api/v1/projects/by-key/{key}` | Get project details by Key (e.g. `TF`) | Project Member |
| `PUT` | `/api/v1/projects/{id}` | Update project details | Project Admin/Owner |
| `DELETE` | `/api/v1/projects/{id}` | Soft delete project | Project Owner |
| `POST` | `/api/v1/projects/{id}/archive` | Archive/unarchive project | Project Owner |
| **Project Members** | | | |
| `GET` | `/api/v1/projects/{projectId}/members` | List members of project | Project Member |
| `POST` | `/api/v1/projects/{projectId}/members` | Add member to project | Project Admin/Owner |
| `PUT` | `/api/v1/projects/{projectId}/members/{userId}` | Update member role | Project Admin/Owner |
| `DELETE` | `/api/v1/projects/{projectId}/members/{userId}` | Remove member from project | Admin/Self |
| **Board & Issues** | | | |
| `GET` | `/api/v1/issues` | Filtered list with pagination | Project Member |
| `POST` | `/api/v1/issues` | Create issue with atomic key | Project Member |
| `GET` | `/api/v1/issues/{id}` | Full issue details, comments, activity | Project Member |
| `GET` | `/api/v1/issues/key/{issueKey}` | Get issue by Key (`TF-1`) | Project Member |
| `PUT` | `/api/v1/issues/{id}` | Update issue fields | Project Member |
| `POST` | `/api/v1/issues/{id}/move` | Move/reorder card (Kanban drag-drop) | Project Member |
| `DELETE` | `/api/v1/issues/{id}` | Delete issue | Reporter / Admin |
| **Sprints** | | | |
| `GET` | `/api/v1/projects/{projectId}/sprints` | List sprints for project | Project Member |
| `POST` | `/api/v1/projects/{projectId}/sprints` | Create planned sprint | Project Admin/Owner |
| `GET` | `/api/v1/sprints/{id}` | Get sprint details & issues | Project Member |
| `PUT` | `/api/v1/sprints/{id}` | Update sprint goal/dates | Project Admin/Owner |
| `POST` | `/api/v1/sprints/{id}/start` | Start sprint (Planned ➔ Active) | Project Admin/Owner |
| `POST` | `/api/v1/sprints/{id}/complete` | Complete sprint & move unfinished | Project Admin/Owner |
| `DELETE` | `/api/v1/sprints/{id}` | Delete sprint & unassign issues | Project Admin/Owner |
| **Comments & Attachments** | | | |
| `GET` | `/api/v1/issues/{issueId}/comments` | List comments for issue | Project Member |
| `POST` | `/api/v1/issues/{issueId}/comments` | Add comment | Project Member |
| `PUT` | `/api/v1/comments/{id}` | Update comment | Comment Author |
| `DELETE` | `/api/v1/comments/{id}` | Delete comment | Author / Admin |
| `GET` | `/api/v1/issues/{issueId}/attachments` | List attachments with signed URLs | Project Member |
| `POST` | `/api/v1/issues/{issueId}/attachments` | Add attachment metadata | Project Member |
| `DELETE` | `/api/v1/attachments/{id}` | Delete attachment & Supabase file | Author / Admin |
| `GET` | `/api/v1/issues/{issueId}/activity` | Issue change history | Project Member |
| **Notifications** | | | |
| `GET` | `/api/v1/notifications` | List user notifications | Authorized |
| `PUT` | `/api/v1/notifications/{id}/read` | Mark single notification as read | Recipient |
| `PUT` | `/api/v1/notifications/read-all` | Mark all notifications as read | Recipient |

---

## 🚀 Getting Started

### 1. Database Setup (Supabase / PostgreSQL)
1. In your Supabase dashboard or local PostgreSQL instance, run:
   - `supabase/migrations/20260930000000_initial_schema.sql`
2. (Optional) Run `supabase/seed.sql` to populate sample users, projects, sprints, and issues.
3. Configure `src/backend/src/TaskFlow.Api/appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=your-supabase-db-host;Port=5432;Database=postgres;Username=postgres;Password=your-password;"
     },
     "Supabase": {
       "Url": "https://your-project-ref.supabase.co",
       "AnonKey": "your-anon-key",
       "JwtSecret": "your-jwt-secret",
       "ServiceRoleKey": "your-service-role-key"
     }
   }
   ```

### 2. Run Backend
```powershell
cd "src/backend"
dotnet build
dotnet run --project "src/TaskFlow.Api"
```
The Swagger UI documentation will be available at:
`http://localhost:5000/swagger` or `https://localhost:5001/swagger`

### 3. Run Frontend (React + TypeScript + Vite)
```powershell
cd "src/frontend"
npm install
npm run dev
```
The application will launch on `http://localhost:5173` (or `http://localhost:5174`).
Features:
- **Kanban Board**: Drag-and-drop cards between Backlog, To Do, In Progress, In Review, Done.
- **Sprint Planning & Backlog**: Manage active and planned iterations with story point velocity tracking.
- **Issue Modal**: Full detail inspection, description editing, commenting, and activity history audit trail.
- **Team Settings**: Role management and member invites.

### 4. Run Tests
```powershell
cd "src/backend"
dotnet test
```
All **26 unit and integration tests** will execute and validate:
- Domain state transitions
- Soft delete behavior
- LexoRank midpoint calculations and ordering
- FluentValidation rules for projects, issues, and sprints
- API `/health` endpoint response
