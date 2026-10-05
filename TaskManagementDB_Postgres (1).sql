-- ==============================================================================
-- PRN232 Assignment 1: TaskTrack Management Database (PostgreSQL / Supabase)
-- Student ID: QE190010
-- Full Name: Trần Nguyễn Bảo Long
-- GitHub: longfptaka3011
-- ==============================================================================

-- 1. Create Schema 'assignment1'
CREATE SCHEMA IF NOT EXISTS assignment1;

-- 2. Drop existing tables if re-running
DROP TABLE IF EXISTS assignment1."TaskTag" CASCADE;
DROP TABLE IF EXISTS assignment1."Task" CASCADE;
DROP TABLE IF EXISTS assignment1."Tag" CASCADE;
DROP TABLE IF EXISTS assignment1."Project" CASCADE;
DROP TABLE IF EXISTS assignment1."Department" CASCADE;

-- 3. Table: Department
CREATE TABLE assignment1."Department" (
    "DepartmentID" SERIAL PRIMARY KEY,
    "DepartmentName" VARCHAR(100) NOT NULL,
    "DepartmentDescription" VARCHAR(300) NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. Table: Project
CREATE TABLE assignment1."Project" (
    "ProjectID" SERIAL PRIMARY KEY,
    "ProjectName" VARCHAR(200) NOT NULL,
    "Description" TEXT NULL,
    "StartDate" DATE NOT NULL,
    "EndDate" DATE NULL,
    "Status" SMALLINT NOT NULL DEFAULT 0, -- 0: Not Started, 1: In Progress, 2: Completed, 3: On Hold
    "DepartmentID" INT NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_Project_Department" FOREIGN KEY ("DepartmentID")
        REFERENCES assignment1."Department" ("DepartmentID")
);

-- 5. Table: Tag
CREATE TABLE assignment1."Tag" (
    "TagID" SERIAL PRIMARY KEY,
    "TagName" VARCHAR(50) NOT NULL UNIQUE,
    "Color" VARCHAR(7) NULL -- Hex code e.g. #3B82F6
);

-- 6. Table: Task
CREATE TABLE assignment1."Task" (
    "TaskID" SERIAL PRIMARY KEY,
    "Title" VARCHAR(300) NOT NULL,
    "Description" TEXT NULL,
    "Status" SMALLINT NOT NULL DEFAULT 0,   -- 0: To Do, 1: In Progress, 2: Done, 3: Cancelled
    "Priority" SMALLINT NOT NULL DEFAULT 1, -- 0: Low, 1: Medium, 2: High, 3: Critical
    "DueDate" DATE NULL,
    "ProjectID" INT NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedDate" TIMESTAMP WITHOUT TIME ZONE NULL,
    CONSTRAINT "FK_Task_Project" FOREIGN KEY ("ProjectID")
        REFERENCES assignment1."Project" ("ProjectID")
);

-- 7. Table: TaskTag (Junction Table)
CREATE TABLE assignment1."TaskTag" (
    "TaskID" INT NOT NULL,
    "TagID" INT NOT NULL,
    PRIMARY KEY ("TaskID", "TagID"),
    CONSTRAINT "FK_TaskTag_Task" FOREIGN KEY ("TaskID")
        REFERENCES assignment1."Task" ("TaskID") ON DELETE CASCADE,
    CONSTRAINT "FK_TaskTag_Tag" FOREIGN KEY ("TagID")
        REFERENCES assignment1."Tag" ("TagID") ON DELETE CASCADE
);

-- ==============================================================================
-- 8. Seed Sample Data
-- ==============================================================================

-- Seed Departments
INSERT INTO assignment1."Department" ("DepartmentName", "DepartmentDescription", "IsActive") VALUES
('Engineering & Technology', 'Software development, infrastructure, and core engineering operations.', TRUE),
('Product & Design', 'Product lifecycle management, UI/UX research, and user interaction design.', TRUE),
('Quality Assurance & DevOps', 'Automated testing, continuous integration, cloud pipelines, and security.', TRUE),
('Business Operations', 'Strategic business development, market expansion, and partnerships.', TRUE);

-- Seed Projects
INSERT INTO assignment1."Project" ("ProjectName", "Description", "StartDate", "EndDate", "Status", "DepartmentID", "IsActive", "CreatedDate") VALUES
('TaskTrack Cloud Platform', 'Modern enterprise task & team workflow management solution built on .NET 10 & React.', '2026-09-01', '2026-12-31', 1, 1, TRUE, CURRENT_TIMESTAMP),
('NextGen Design System', 'Comprehensive UI token library and responsive components with glassmorphism aesthetics.', '2026-09-15', '2026-11-30', 1, 2, TRUE, CURRENT_TIMESTAMP),
('Automated CI/CD Pipeline', 'GitHub Actions workflow integration with Dockerized deployment to cloud platforms.', '2026-10-01', '2026-10-25', 2, 3, TRUE, CURRENT_TIMESTAMP),
('Enterprise Security Audit', 'Database encryption, Supabase RLS policies verification, and vulnerability scanning.', '2026-10-10', '2026-11-15', 0, 3, TRUE, CURRENT_TIMESTAMP);

-- Seed Tags
INSERT INTO assignment1."Tag" ("TagName", "Color") VALUES
('Frontend', '#3B82F6'),
('Backend', '#10B981'),
('Database', '#8B5CF6'),
('DevOps', '#F59E0B'),
('Bug', '#EF4444'),
('Feature', '#6366F1'),
('High Priority', '#EC4899');

-- Seed Tasks
INSERT INTO assignment1."Task" ("Title", "Description", "Status", "Priority", "DueDate", "ProjectID", "IsActive", "CreatedDate") VALUES
('Setup PostgreSQL Database Schema', 'Design normalized relational tables and apply constraints in assignment1 schema on Supabase.', 2, 3, '2026-09-05', 1, TRUE, CURRENT_TIMESTAMP),
('Implement 3-Tier Layered Architecture', 'Build Controllers, Services, and Repositories with EF Core 10 Database-First approach.', 2, 2, '2026-09-12', 1, TRUE, CURRENT_TIMESTAMP),
('Develop React 19 Frontend SPA', 'Construct responsive dashboard, navigation sidebar, and CRUD modals with Lucide icons.', 1, 2, '2026-10-15', 1, TRUE, CURRENT_TIMESTAMP),
('Configure Supabase Connection & Pooler', 'Integrate Npgsql connection string with SSL Require and verify CRUD operations.', 1, 3, '2026-10-18', 1, TRUE, CURRENT_TIMESTAMP),
('Design Component Tokens & Theme', 'Implement dark/light themes and modern color palette in design-tokens.json.', 2, 1, '2026-09-20', 2, TRUE, CURRENT_TIMESTAMP),
('Build GitHub Actions CI Pipeline', 'Automate .NET 10 compilation, npm test, and oxlint validation on pull requests.', 2, 2, '2026-10-05', 3, TRUE, CURRENT_TIMESTAMP),
('Conduct Penetration & SQL Injection Test', 'Verify parameterized queries in EF Core to ensure absolute data security.', 0, 1, '2026-11-01', 4, TRUE, CURRENT_TIMESTAMP);

-- Seed TaskTag relations
INSERT INTO assignment1."TaskTag" ("TaskID", "TagID") VALUES
(1, 3), -- Setup DB -> Database
(2, 2), -- 3-Tier Arch -> Backend
(2, 6), -- 3-Tier Arch -> Feature
(3, 1), -- Frontend SPA -> Frontend
(3, 6), -- Frontend SPA -> Feature
(4, 2), -- Supabase Connection -> Backend
(4, 3), -- Supabase Connection -> Database
(4, 7), -- Supabase Connection -> High Priority
(5, 1), -- Component Tokens -> Frontend
(6, 4), -- GitHub Actions CI -> DevOps
(7, 2), -- Penetration Test -> Backend
(7, 7); -- Penetration Test -> High Priority
