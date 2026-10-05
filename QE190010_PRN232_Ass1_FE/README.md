# TaskTrack - Task & Team Management App

A modern Task Management web application built with **React (Vite + TypeScript)** frontend and **ASP.NET Core Web API** backend.

![TaskTrack Preview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-19.x-61dafb)

## 🎯 Overview

This is the **PRN232 Assignment 1** project - Task & Team Management App focusing on:
- Project scaffolding and folder structure
- Database setup with Entity Framework Core on PostgreSQL
- Public CRUD interface for Departments, Projects, and Tasks
- Modern responsive UI with status badges and progress tracking

## 📁 Project Structure

```
Assignment 1 - Official/
├── QE190010_PRN232_Ass1_BE/           # Backend (ASP.NET Core Web API)
│   ├── TaskTrack.API/                 # Controllers, Program.cs, appsettings.json
│   ├── TaskTrack.Repo/               # EF Core entities, DbContext, Repositories
│   ├── TaskTrack.Service/            # Service interfaces and implementations
│   ├── ERD.svg                       # Entity Relationship Diagram
│   └── Dockerfile                    # Docker configuration for deployment
│
└── QE190010_PRN232_Ass1_FE/          # Frontend (React + Vite + TypeScript)
    ├── src/
    │   ├── components/               # Reusable UI components (Layout, etc.)
    │   ├── pages/                    # Page components (Dashboard, TaskList, etc.)
    │   ├── services/                 # API service modules
    │   ├── types/                    # TypeScript type definitions
    │   └── App.tsx                   # Main app with routing
    └── package.json
```

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** - Fast build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Custom styling with modern design

### Backend
- **ASP.NET Core Web API** (.NET 10)
- **Entity Framework Core** - Database ORM
- **PostgreSQL** - Database
- **Swagger/OpenAPI** - API documentation

## 🚀 Features

### Public Pages
- ✅ **Dashboard** - Overview with stats, project schedules, progress chart, activities
- ✅ **Departments** - List and view department details
- ✅ **Projects** - List projects with status filtering
- ✅ **Tasks** - Full task list with status filter
- ✅ **Tags** - Tag management

### Management Features
- ✅ Create, Edit, Delete for all entities
- ✅ Search and filter capabilities
- ✅ Status badges with color coding
- ✅ Progress tracking for projects
- ✅ Tag selection for tasks
- ✅ Confirmation dialogs for destructive actions

### Status & Priority
| Task Status | Project Status | Priority |
|------------|----------------|----------|
| To Do | Not Started | Low |
| In Progress | In Progress | Medium |
| Done | Completed | High |
| Cancelled | On Hold | Critical |

## 📊 Entity Relationship Diagram

![ERD Diagram](QE190010_PRN232_Ass1_BE/ERD.svg)

The ERD shows the following relationships:
- **Department → Project**: One-to-Many (1 department has N projects)
- **Project → Task**: One-to-Many (1 project has N tasks)
- **Task ↔ Tag**: Many-to-Many (via TaskTag junction table)

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- .NET 10 SDK
- PostgreSQL database

### Backend Setup

```bash
cd QE190010_PRN232_Ass1_BE/TaskTrack.API

# Configure environment variables
# Create .env file with:
#   DATABASE_HOST=your-postgres-host
#   DATABASE_PORT=5432
#   DATABASE_NAME=postgres
#   DATABASE_USERNAME=your-username
#   DATABASE_PASSWORD=your-password

# Run the API
dotnet run --urls="http://localhost:5000"
```

The API will be available at: `http://localhost:5000`
Swagger documentation: `http://localhost:5000/swagger`

### Frontend Setup

```bash
cd QE190010_PRN232_Ass1_FE

# Install dependencies
npm install

# Create .env file:
#   VITE_API_URL=http://localhost:5000/api

# Run in development mode
npm run dev
```

The app will be available at: `http://localhost:3000`

## 🌐 API Endpoints

### Departments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments` | List all active departments |
| GET | `/api/departments/{id}` | Get department with projects |
| POST | `/api/departments` | Create new department |
| PUT | `/api/departments/{id}` | Update department |
| DELETE | `/api/departments/{id}` | Delete department |
| GET | `/api/departments/search?name=` | Search departments |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all active projects |
| GET | `/api/projects/{id}` | Get project with tasks |
| GET | `/api/projects/department/{id}` | Get projects by department |
| POST | `/api/projects` | Create new project |
| PUT | `/api/projects/{id}` | Update project |
| DELETE | `/api/projects/{id}` | Delete project |
| GET | `/api/projects/search?name=&status=&departmentId=` | Filter projects |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all active tasks |
| GET | `/api/tasks/{id}` | Get task with tags |
| GET | `/api/tasks/project/{id}` | Get tasks by project |
| POST | `/api/tasks` | Create new task |
| PUT | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Soft-delete task |
| GET | `/api/tasks/search?title=&status=&priority=&projectId=&tagId=` | Filter tasks |

### Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags` | List all tags |
| POST | `/api/tags` | Create new tag |
| PUT | `/api/tags/{id}` | Update tag |
| DELETE | `/api/tags/{id}` | Delete tag |

## 📦 Deployment

### Backend (Render.com)
1. Push to public GitHub repository
2. Create Web Service on Render.com
3. Set environment variables:
   - `DATABASE_URL` (PostgreSQL connection string)
   - `ASPNETCORE_ENVIRONMENT=Production`
4. Deploy from GitHub

### Frontend (Vercel)
1. Push to public GitHub repository
2. Import project in Vercel
3. Set environment variable:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL
4. Deploy from GitHub

## ⚙️ CI/CD

This project includes GitHub Actions workflows for continuous integration:

### Backend CI
- .NET restore
- Build solution

### Frontend CI
- npm install
- Lint code
- Build production bundle

Workflow file: `.github/workflows/ci.yml`

## 🎨 UI Preview

The application features a modern, clean interface with:
- **Purple gradient theme** (#6c5ce7)
- **Collapsible sidebar** navigation
- **Card-based layouts** for better readability
- **Status badges** with color coding
- **Progress bars** and charts
- **Responsive design** for all screen sizes

## 👥 Team

- Student ID: QE190010
- Full Name: Trần Nguyễn Bảo Long
- GitHub: longfptaka3011
- Class: PRN232
- Assignment: 1 of 2

## 📄 License

This project is for educational purposes as part of the PRN232 course assignment.
