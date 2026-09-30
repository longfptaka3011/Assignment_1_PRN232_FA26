-- Sample Seed Data for TaskFlow Development / Testing
-- Demo Profiles (UUIDs match standard test users)
INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'alex.developer@taskflow.dev', 'Alex Developer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'sarah.pm@taskflow.dev', 'Sarah Product Manager', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'john.designer@taskflow.dev', 'John Designer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Demo Project
INSERT INTO public.projects (id, name, key, description, lead_id, issue_counter, is_archived, created_at, updated_at)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TaskFlow Platform', 'TF', 'Modern Agile & Kanban Project Management System', '22222222-2222-2222-2222-222222222222', 4, FALSE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Project Members
INSERT INTO public.project_members (id, project_id, user_id, role, joined_at)
VALUES 
    (uuid_generate_v4(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Owner', NOW()),
    (uuid_generate_v4(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Admin', NOW()),
    (uuid_generate_v4(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'Member', NOW())
ON CONFLICT DO NOTHING;

-- Issue Types
INSERT INTO public.issue_types (id, project_id, name, icon_name, category, order_index, is_subtask)
VALUES 
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Epic', 'bookmark', 'Epic', 0, FALSE),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Story', 'check-circle', 'Story', 1, FALSE),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Task', 'clipboard-document-list', 'Task', 2, FALSE),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bug', 'bug-ant', 'Bug', 3, FALSE),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb05', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sub-task', 'bars-3-bottom-left', 'Subtask', 4, TRUE)
ON CONFLICT DO NOTHING;

-- Issue Statuses
INSERT INTO public.issue_statuses (id, project_id, name, color_hex, order_index, is_completed_status)
VALUES 
    ('cccccccc-cccc-cccc-cccc-cccccccccc01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Backlog', '#6B7280', 0, FALSE),
    ('cccccccc-cccc-cccc-cccc-cccccccccc02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'To Do', '#3B82F6', 1, FALSE),
    ('cccccccc-cccc-cccc-cccc-cccccccccc03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'In Progress', '#F59E0B', 2, FALSE),
    ('cccccccc-cccc-cccc-cccc-cccccccccc04', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'In Review', '#8B5CF6', 3, FALSE),
    ('cccccccc-cccc-cccc-cccc-cccccccccc05', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Done', '#10B981', 4, TRUE)
ON CONFLICT DO NOTHING;

-- Workflow Transitions
INSERT INTO public.workflow_transitions (id, project_id, from_status_id, to_status_id, name)
VALUES 
    (uuid_generate_v4(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'cccccccc-cccc-cccc-cccc-cccccccccc02', 'Move to To Do'),
    (uuid_generate_v4(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccc02', 'cccccccc-cccc-cccc-cccc-cccccccccc03', 'Start Progress'),
    (uuid_generate_v4(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccc03', 'cccccccc-cccc-cccc-cccc-cccccccccc04', 'Submit Review'),
    (uuid_generate_v4(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccc04', 'cccccccc-cccc-cccc-cccc-cccccccccc05', 'Approve & Complete'),
    (uuid_generate_v4(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccc04', 'cccccccc-cccc-cccc-cccc-cccccccccc03', 'Request Changes')
ON CONFLICT DO NOTHING;

-- Labels
INSERT INTO public.labels (id, project_id, name, color_hex)
VALUES 
    ('dddddddd-dddd-dddd-dddd-dddddddddd01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Frontend', '#3B82F6'),
    ('dddddddd-dddd-dddd-dddd-dddddddddd02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Backend', '#10B981'),
    ('dddddddd-dddd-dddd-dddd-dddddddddd03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'UI/UX', '#EC4899'),
    ('dddddddd-dddd-dddd-dddd-dddddddddd04', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Urgent', '#EF4444')
ON CONFLICT DO NOTHING;

-- Sprint 1 (Active)
INSERT INTO public.sprints (id, project_id, name, goal, status, start_date, end_date, created_at, updated_at)
VALUES 
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sprint 1 - MVP Release', 'Complete core authentication, board view, and issue CRUD', 'Active', NOW() - INTERVAL '3 days', NOW() + INTERVAL '11 days', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Sample Issues
INSERT INTO public.issues (id, project_id, issue_number, issue_key, title, description, type_id, status_id, priority, assignee_id, reporter_id, sprint_id, story_points, position, created_at, updated_at)
VALUES 
    ('ffffffff-ffff-ffff-ffff-ffffffff0001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'TF-1', 'Setup Supabase JWT Bearer Auth', 'Configure Supabase authentication and JWT bearer token validation in backend API.', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'cccccccc-cccc-cccc-cccc-cccccccccc05', 'High', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, '0|100000:', NOW(), NOW()),
    ('ffffffff-ffff-ffff-ffff-ffffffff0002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'TF-2', 'Implement Kanban drag-and-drop board', 'Create smooth interactive Kanban board with LexoRank ordering for columns and cards.', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'cccccccc-cccc-cccc-cccc-cccccccccc03', 'High', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 5, '0|200000:', NOW(), NOW()),
    ('ffffffff-ffff-ffff-ffff-ffffffff0003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'TF-3', 'Design Modern UI Theme & Design Tokens', 'Define glassmorphic design system, typography, and dark mode palette.', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'cccccccc-cccc-cccc-cccc-cccccccccc04', 'Medium', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, '0|300000:', NOW(), NOW()),
    ('ffffffff-ffff-ffff-ffff-ffffffff0004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 'TF-4', 'Sprint Management & Backlog View', 'Allow creating sprints, planning backlog issues, starting and completing sprints.', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'cccccccc-cccc-cccc-cccc-cccccccccc02', 'High', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 5, '0|400000:', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Issue Labels
INSERT INTO public.issue_labels (issue_id, label_id)
VALUES 
    ('ffffffff-ffff-ffff-ffff-ffffffff0001', 'dddddddd-dddd-dddd-dddd-dddddddddd02'),
    ('ffffffff-ffff-ffff-ffff-ffffffff0002', 'dddddddd-dddd-dddd-dddd-dddddddddd01'),
    ('ffffffff-ffff-ffff-ffff-ffffffff0003', 'dddddddd-dddd-dddd-dddd-dddddddddd03'),
    ('ffffffff-ffff-ffff-ffff-ffffffff0004', 'dddddddd-dddd-dddd-dddd-dddddddddd02')
ON CONFLICT DO NOTHING;

-- Sample Comments
INSERT INTO public.comments (id, issue_id, user_id, content, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'ffffffff-ffff-ffff-ffff-ffffffff0002', '22222222-2222-2222-2222-222222222222', 'Make sure to handle optimistic UI updates when moving cards between columns.', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Issue Links (TF-2 relates to TF-1)
INSERT INTO public.issue_links (id, source_issue_id, target_issue_id, link_type, created_by, created_at)
VALUES 
    (uuid_generate_v4(), 'ffffffff-ffff-ffff-ffff-ffffffff0002', 'ffffffff-ffff-ffff-ffff-ffffffff0001', 'RelatesTo', '22222222-2222-2222-2222-222222222222', NOW())
ON CONFLICT DO NOTHING;

-- Issue Watchers (Sarah watches TF-2)
INSERT INTO public.issue_watchers (issue_id, user_id, created_at)
VALUES 
    ('ffffffff-ffff-ffff-ffff-ffffffff0002', '22222222-2222-2222-2222-222222222222', NOW()),
    ('ffffffff-ffff-ffff-ffff-ffffffff0002', '11111111-1111-1111-1111-111111111111', NOW())
ON CONFLICT DO NOTHING;

-- Saved Filters
INSERT INTO public.saved_filters (id, user_id, project_id, name, filter_query, is_favorite, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'My Active Issues', '{"assigneeId": "11111111-1111-1111-1111-111111111111", "status": "In Progress"}'::jsonb, TRUE, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Work Logs
INSERT INTO public.work_logs (id, issue_id, user_id, time_spent_minutes, started_at, description, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'ffffffff-ffff-ffff-ffff-ffffffff0002', '11111111-1111-1111-1111-111111111111', 120, NOW() - INTERVAL '1 day', 'Implemented LexoRank calculation and drag drop events', NOW(), NOW())
ON CONFLICT DO NOTHING;
