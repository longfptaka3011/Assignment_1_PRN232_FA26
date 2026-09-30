-- Enable UUID and full-text search extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- -------------------------------------------------------------
-- 0. Shared Utility Functions & Triggers
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------
-- 1. Profiles Table (linked to Supabase auth.users)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    avatar_url VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------
-- 2. Projects Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    key VARCHAR(10) NOT NULL,
    description TEXT,
    lead_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    issue_counter INT NOT NULL DEFAULT 0,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_key ON public.projects(key) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------
-- 3. Project Members Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'Member' CHECK (role IN ('Owner', 'Admin', 'Member', 'Viewer')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_members_project_user UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);

-- -------------------------------------------------------------
-- 4. Issue Types Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.issue_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    icon_name VARCHAR(50) NOT NULL DEFAULT 'bookmark',
    category VARCHAR(20) NOT NULL DEFAULT 'Task' CHECK (category IN ('Epic', 'Story', 'Task', 'Bug', 'Subtask')),
    order_index INT NOT NULL DEFAULT 0,
    is_subtask BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_issue_types_project_name UNIQUE (project_id, name)
);

-- -------------------------------------------------------------
-- 5. Issue Statuses Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.issue_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color_hex VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    order_index INT NOT NULL DEFAULT 0,
    is_completed_status BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_issue_statuses_project_name UNIQUE (project_id, name)
);

-- -------------------------------------------------------------
-- 6. Workflow Transitions Table (Nhóm C - Custom Workflows)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workflow_transitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    from_status_id UUID NOT NULL REFERENCES public.issue_statuses(id) ON DELETE CASCADE,
    to_status_id UUID NOT NULL REFERENCES public.issue_statuses(id) ON DELETE CASCADE,
    name VARCHAR(100),
    CONSTRAINT uq_workflow_transitions UNIQUE (project_id, from_status_id, to_status_id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_transitions_from ON public.workflow_transitions(project_id, from_status_id);

-- -------------------------------------------------------------
-- 7. Sprints Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    goal TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'Active', 'Completed')),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sprints_project_status ON public.sprints(project_id, status) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_sprints_updated_at ON public.sprints;
CREATE TRIGGER trg_sprints_updated_at
    BEFORE UPDATE ON public.sprints
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------
-- 8. Issues Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    issue_number INT NOT NULL,
    issue_key VARCHAR(25) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type_id UUID NOT NULL REFERENCES public.issue_types(id) ON DELETE RESTRICT,
    status_id UUID NOT NULL REFERENCES public.issue_statuses(id) ON DELETE RESTRICT,
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Lowest', 'Low', 'Medium', 'High', 'Highest')),
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    story_points NUMERIC(4, 1),
    position VARCHAR(255) NOT NULL DEFAULT '0|hzzzzz:',
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_issues_issue_key UNIQUE (issue_key),
    CONSTRAINT uq_issues_project_number UNIQUE (project_id, issue_number)
);

CREATE INDEX IF NOT EXISTS idx_issues_project_status_position ON public.issues(project_id, status_id, position) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_issues_assignee ON public.issues(assignee_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_issues_sprint ON public.issues(sprint_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_issues_parent ON public.issues(parent_id) WHERE deleted_at IS NULL;

-- Full-text search GIN index on title and description
CREATE INDEX IF NOT EXISTS idx_issues_search_gin ON public.issues USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, ''))) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_issues_updated_at ON public.issues;
CREATE TRIGGER trg_issues_updated_at
    BEFORE UPDATE ON public.issues
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------
-- 9. Issue Links Table (Nhóm B - Issue Relationships)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.issue_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    target_issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    link_type VARCHAR(30) NOT NULL CHECK (link_type IN ('Blocks', 'IsBlockedBy', 'RelatesTo', 'Duplicates')),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_issue_links UNIQUE (source_issue_id, target_issue_id, link_type),
    CONSTRAINT chk_issue_links_no_self CHECK (source_issue_id <> target_issue_id)
);

CREATE INDEX IF NOT EXISTS idx_issue_links_source ON public.issue_links(source_issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_links_target ON public.issue_links(target_issue_id);

-- -------------------------------------------------------------
-- 10. Issue Watchers Table (Nhóm B - Subscribe/Watch)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.issue_watchers (
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (issue_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_issue_watchers_user ON public.issue_watchers(user_id);

-- -------------------------------------------------------------
-- 11. Labels Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color_hex VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    CONSTRAINT uq_labels_project_name UNIQUE (project_id, name)
);

-- -------------------------------------------------------------
-- 12. Issue Labels Junction Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.issue_labels (
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
    PRIMARY KEY (issue_id, label_id)
);

-- -------------------------------------------------------------
-- 13. Comments Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comments_issue_created ON public.comments(issue_id, created_at) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_comments_updated_at ON public.comments;
CREATE TRIGGER trg_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------
-- 14. Attachments Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_issue ON public.attachments(issue_id);

-- -------------------------------------------------------------
-- 15. Activity Logs Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type VARCHAR(30) NOT NULL,
    field_name VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_issue_created ON public.activity_logs(issue_id, created_at);

-- -------------------------------------------------------------
-- 16. Notifications Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON public.notifications(recipient_id, is_read, created_at);

-- -------------------------------------------------------------
-- 17. Saved Filters Table (Nhóm A - Search & Filtering)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    filter_query JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_filters_user ON public.saved_filters(user_id);

DROP TRIGGER IF EXISTS trg_saved_filters_updated_at ON public.saved_filters;
CREATE TRIGGER trg_saved_filters_updated_at
    BEFORE UPDATE ON public.saved_filters
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------
-- 18. Work Logs Table (Nhóm C - Time Tracking)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.work_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    time_spent_minutes INT NOT NULL CHECK (time_spent_minutes > 0),
    started_at TIMESTAMPTZ NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_work_logs_issue ON public.work_logs(issue_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_work_logs_user ON public.work_logs(user_id) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_work_logs_updated_at ON public.work_logs;
CREATE TRIGGER trg_work_logs_updated_at
    BEFORE UPDATE ON public.work_logs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------
-- Supabase Auth Sync Trigger:
-- Synchronize user records from auth.users to public.profiles
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, 'User'), '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = CASE 
            WHEN profiles.full_name IS NULL OR profiles.full_name = '' THEN EXCLUDED.full_name 
            ELSE profiles.full_name 
        END,
        avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES FOR ALL 18 TABLES
-- Defense in depth for Supabase PostgREST client direct calls
-- -------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" 
    ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. Projects Policies
DROP POLICY IF EXISTS "Projects viewable by members" ON public.projects;
CREATE POLICY "Projects viewable by members" 
    ON public.projects FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_members.project_id = projects.id AND project_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
CREATE POLICY "Authenticated users can create projects" 
    ON public.projects FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = lead_id);

DROP POLICY IF EXISTS "Owners and admins can update projects" ON public.projects;
CREATE POLICY "Owners and admins can update projects" 
    ON public.projects FOR UPDATE TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_members.project_id = projects.id AND project_members.user_id = auth.uid() AND project_members.role IN ('Owner', 'Admin')));

-- 3. Project Members Policies
DROP POLICY IF EXISTS "Members viewable by project members" ON public.project_members;
CREATE POLICY "Members viewable by project members" 
    ON public.project_members FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage project members" ON public.project_members;
CREATE POLICY "Admins can manage project members" 
    ON public.project_members FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid() AND pm.role IN ('Owner', 'Admin')));

-- 4. Issue Types & Statuses Policies
DROP POLICY IF EXISTS "Issue types viewable by project members" ON public.issue_types;
CREATE POLICY "Issue types viewable by project members" 
    ON public.issue_types FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_members.project_id = issue_types.project_id AND project_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "Issue statuses viewable by project members" ON public.issue_statuses;
CREATE POLICY "Issue statuses viewable by project members" 
    ON public.issue_statuses FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_members.project_id = issue_statuses.project_id AND project_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "Workflow transitions viewable by project members" ON public.workflow_transitions;
CREATE POLICY "Workflow transitions viewable by project members" 
    ON public.workflow_transitions FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_members.project_id = workflow_transitions.project_id AND project_members.user_id = auth.uid()));

-- 5. Sprints Policies
DROP POLICY IF EXISTS "Sprints viewable by project members" ON public.sprints;
CREATE POLICY "Sprints viewable by project members" 
    ON public.sprints FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_members.project_id = sprints.project_id AND project_members.user_id = auth.uid()));

-- 6. Issues Policies
DROP POLICY IF EXISTS "Issues viewable by project members" ON public.issues;
CREATE POLICY "Issues viewable by project members" 
    ON public.issues FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_members.project_id = issues.project_id AND project_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "Issues manageable by active project members" ON public.issues;
CREATE POLICY "Issues manageable by active project members" 
    ON public.issues FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_members.project_id = issues.project_id AND project_members.user_id = auth.uid() AND project_members.role IN ('Owner', 'Admin', 'Member')));

-- 7. Issue Links & Watchers Policies
DROP POLICY IF EXISTS "Issue links viewable by project members" ON public.issue_links;
CREATE POLICY "Issue links viewable by project members" 
    ON public.issue_links FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM public.issues i 
        JOIN public.project_members pm ON pm.project_id = i.project_id 
        WHERE i.id = issue_links.source_issue_id AND pm.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Issue watchers viewable by project members" ON public.issue_watchers;
CREATE POLICY "Issue watchers viewable by project members" 
    ON public.issue_watchers FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM public.issues i 
        JOIN public.project_members pm ON pm.project_id = i.project_id 
        WHERE i.id = issue_watchers.issue_id AND pm.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can manage their own watcher records" ON public.issue_watchers;
CREATE POLICY "Users can manage their own watcher records" 
    ON public.issue_watchers FOR ALL TO authenticated 
    USING (user_id = auth.uid());

-- 8. Labels & Issue Labels Policies
DROP POLICY IF EXISTS "Labels viewable by project members" ON public.labels;
CREATE POLICY "Labels viewable by project members" 
    ON public.labels FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_members.project_id = labels.project_id AND project_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "Issue labels viewable by project members" ON public.issue_labels;
CREATE POLICY "Issue labels viewable by project members" 
    ON public.issue_labels FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM public.issues i 
        JOIN public.project_members pm ON pm.project_id = i.project_id 
        WHERE i.id = issue_labels.issue_id AND pm.user_id = auth.uid()
    ));

-- 9. Comments, Attachments & Activity Logs Policies
DROP POLICY IF EXISTS "Comments viewable by project members" ON public.comments;
CREATE POLICY "Comments viewable by project members" 
    ON public.comments FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM public.issues i 
        JOIN public.project_members pm ON pm.project_id = i.project_id 
        WHERE i.id = comments.issue_id AND pm.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Comments editable by creator" ON public.comments;
CREATE POLICY "Comments editable by creator" 
    ON public.comments FOR UPDATE TO authenticated 
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Attachments viewable by project members" ON public.attachments;
CREATE POLICY "Attachments viewable by project members" 
    ON public.attachments FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM public.issues i 
        JOIN public.project_members pm ON pm.project_id = i.project_id 
        WHERE i.id = attachments.issue_id AND pm.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Activity logs viewable by project members" ON public.activity_logs;
CREATE POLICY "Activity logs viewable by project members" 
    ON public.activity_logs FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM public.issues i 
        JOIN public.project_members pm ON pm.project_id = i.project_id 
        WHERE i.id = activity_logs.issue_id AND pm.user_id = auth.uid()
    ));

-- 10. Notifications Policies
DROP POLICY IF EXISTS "Notifications viewable only by recipient" ON public.notifications;
CREATE POLICY "Notifications viewable only by recipient" 
    ON public.notifications FOR ALL TO authenticated 
    USING (recipient_id = auth.uid());

-- 11. Saved Filters Policies
DROP POLICY IF EXISTS "Saved filters viewable only by owner" ON public.saved_filters;
CREATE POLICY "Saved filters viewable only by owner" 
    ON public.saved_filters FOR ALL TO authenticated 
    USING (user_id = auth.uid());

-- 12. Work Logs Policies
DROP POLICY IF EXISTS "Work logs viewable by project members" ON public.work_logs;
CREATE POLICY "Work logs viewable by project members" 
    ON public.work_logs FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM public.issues i 
        JOIN public.project_members pm ON pm.project_id = i.project_id 
        WHERE i.id = work_logs.issue_id AND pm.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Work logs manageable by creator" ON public.work_logs;
CREATE POLICY "Work logs manageable by creator" 
    ON public.work_logs FOR ALL TO authenticated 
    USING (user_id = auth.uid());
