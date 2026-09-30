import {
  Project,
  ProjectDetail,
  ProjectMember,
  Issue,
  IssueDetail,
  Sprint,
  SprintDetail,
  Notification,
  Comment,
  Attachment,
  ActivityLog,
  ProjectRole,
  IssuePriority,
  SprintStatus,
  IssueLink,
  IssueWatcher,
  IssueLinkType,
  WorkflowTransition,
  WorkLog,
  SprintBurndown,
  SprintVelocity,
  MemberWorkload,
  ImportResult
} from '../types';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const getAuthHeaders = (): Record<string, string> => {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const authFetch = async (url: string, init?: RequestInit): Promise<Response> => {
  const headers = {
    ...getAuthHeaders(),
    ...(init?.headers || {})
  };
  return fetch(url, { ...init, headers });
};

// Seed demo state
let mockProjects: ProjectDetail[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'TaskFlow Platform',
    key: 'TF',
    description: 'Modern Agile & Kanban Project Management System built with Clean Architecture.',
    leadId: '22222222-2222-2222-2222-222222222222',
    leadName: 'Sarah Product Manager',
    leadAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    issueCounter: 4,
    isArchived: false,
    memberCount: 3,
    issueCount: 4,
    createdAt: new Date().toISOString(),
    members: [
      {
        id: 'm1',
        projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        userId: '22222222-2222-2222-2222-222222222222',
        email: 'sarah.pm@taskflow.dev',
        fullName: 'Sarah Product Manager',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        role: 'Owner',
        joinedAt: new Date().toISOString()
      },
      {
        id: 'm2',
        projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        userId: '11111111-1111-1111-1111-111111111111',
        email: 'alex.developer@taskflow.dev',
        fullName: 'Alex Developer',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        role: 'Admin',
        joinedAt: new Date().toISOString()
      },
      {
        id: 'm3',
        projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        userId: '33333333-3333-3333-3333-333333333333',
        email: 'john.designer@taskflow.dev',
        fullName: 'John Designer',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        role: 'Member',
        joinedAt: new Date().toISOString()
      }
    ],
    issueTypes: [
      { id: 't1', projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Epic', iconName: 'bookmark', category: 'Epic', orderIndex: 0, isSubtask: false },
      { id: 't2', projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Story', iconName: 'check-circle', category: 'Story', orderIndex: 1, isSubtask: false },
      { id: 't3', projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Task', iconName: 'clipboard-document-list', category: 'Task', orderIndex: 2, isSubtask: false },
      { id: 't4', projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Bug', iconName: 'bug-ant', category: 'Bug', orderIndex: 3, isSubtask: false },
      { id: 't5', projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Sub-task', iconName: 'bars-3-bottom-left', category: 'Subtask', orderIndex: 4, isSubtask: true }
    ],
    issueStatuses: [
      { id: 's1', projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Backlog', colorHex: '#64748b', orderIndex: 0, isCompletedStatus: false },
      { id: 's2', projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'To Do', colorHex: '#38bdf8', orderIndex: 1, isCompletedStatus: false },
      { id: 's3', projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'In Progress', colorHex: '#f59e0b', orderIndex: 2, isCompletedStatus: false },
      { id: 's4', projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'In Review', colorHex: '#a855f7', orderIndex: 3, isCompletedStatus: false },
      { id: 's5', projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Done', colorHex: '#10b981', orderIndex: 4, isCompletedStatus: true }
    ],
    labels: [
      { id: 'l1', projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Frontend', colorHex: '#38bdf8' },
      { id: 'l2', projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Backend', colorHex: '#10b981' },
      { id: 'l3', projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'UI/UX', colorHex: '#ec4899' },
      { id: 'l4', projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Urgent', colorHex: '#ef4444' }
    ]
  }
];

let mockSprints: Sprint[] = [
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Sprint 1 - Core Foundations',
    goal: 'Deliver JWT auth, clean architecture API, and dynamic Kanban board.',
    status: 'Active',
    startDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 11 * 86400000).toISOString(),
    issueCount: 4,
    totalStoryPoints: 16,
    completedStoryPoints: 3,
    createdAt: new Date().toISOString()
  }
];

let mockIssues: IssueDetail[] = [
  {
    id: 'i1',
    projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    issueNumber: 1,
    issueKey: 'TF-1',
    title: 'Setup Supabase JWT Bearer Auth & Clean Architecture',
    description: 'Configure JWT bearer token validation in ASP.NET Core API with project-level RBAC handler.',
    typeId: 't3',
    typeName: 'Task',
    typeIconName: 'clipboard-document-list',
    typeCategory: 'Task',
    statusId: 's5',
    statusName: 'Done',
    statusColorHex: '#10b981',
    isCompletedStatus: true,
    priority: 'High',
    assigneeId: '11111111-1111-1111-1111-111111111111',
    assigneeName: 'Alex Developer',
    assigneeAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    reporterId: '22222222-2222-2222-2222-222222222222',
    reporterName: 'Sarah Product Manager',
    sprintId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sprintName: 'Sprint 1 - Core Foundations',
    storyPoints: 3,
    position: '0|100000:',
    rowVersion: 1,
    labels: [{ id: 'l2', projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Backend', colorHex: '#10b981' }],
    commentCount: 1,
    attachmentCount: 0,
    subtaskCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [],
    comments: [
      {
        id: 'c1',
        issueId: 'i1',
        userId: '22222222-2222-2222-2222-222222222222',
        userName: 'Sarah Product Manager',
        userAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        content: 'JWT token verification tested and fully functional!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    attachments: [],
    activityLogs: [
      {
        id: 'a1',
        issueId: 'i1',
        userId: '22222222-2222-2222-2222-222222222222',
        userName: 'Sarah Product Manager',
        activityType: 'Created',
        newValue: 'Setup Supabase JWT Bearer Auth & Clean Architecture',
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'i2',
    projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    issueNumber: 2,
    issueKey: 'TF-2',
    title: 'Implement Interactive Kanban Drag-and-Drop Board',
    description: 'Build rich interactive board with columns, card ordering using LexoRank, and column transitions.',
    typeId: 't2',
    typeName: 'Story',
    typeIconName: 'check-circle',
    typeCategory: 'Story',
    statusId: 's3',
    statusName: 'In Progress',
    statusColorHex: '#f59e0b',
    isCompletedStatus: false,
    priority: 'Urgent',
    assigneeId: '11111111-1111-1111-1111-111111111111',
    assigneeName: 'Alex Developer',
    assigneeAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    reporterId: '22222222-2222-2222-2222-222222222222',
    reporterName: 'Sarah Product Manager',
    sprintId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sprintName: 'Sprint 1 - Core Foundations',
    storyPoints: 5,
    position: '0|200000:',
    rowVersion: 1,
    labels: [{ id: 'l1', projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Frontend', colorHex: '#38bdf8' }],
    commentCount: 0,
    attachmentCount: 2,
    subtaskCount: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [
      {
        id: 'sub-1',
        projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        issueNumber: 5,
        issueKey: 'TF-5',
        title: 'Design droppable column layout & header styles',
        description: 'Setup droppable column containers with glassmorphic aesthetic.',
        typeId: 't5',
        typeName: 'Sub-task',
        typeIconName: 'bars-3-bottom-left',
        typeCategory: 'Subtask',
        statusId: 's5',
        statusName: 'Done',
        statusColorHex: '#10b981',
        isCompletedStatus: true,
        priority: 'Medium',
        parentId: 'i2',
        storyPoints: 1,
        position: '0|100000:',
        rowVersion: 1,
        labels: [],
        commentCount: 0,
        attachmentCount: 0,
        subtaskCount: 0,
        reporterId: '22222222-2222-2222-2222-222222222222',
        reporterName: 'Sarah Product Manager',
        assigneeId: '33333333-3333-3333-3333-333333333333',
        assigneeName: 'John Designer',
        assigneeAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'sub-2',
        projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        issueNumber: 6,
        issueKey: 'TF-6',
        title: 'Integrate @dnd-kit sensors and drag overlay',
        description: 'Configure PointerSensor with 4px activation constraint and DragOverlay.',
        typeId: 't5',
        typeName: 'Sub-task',
        typeIconName: 'bars-3-bottom-left',
        typeCategory: 'Subtask',
        statusId: 's5',
        statusName: 'Done',
        statusColorHex: '#10b981',
        isCompletedStatus: true,
        priority: 'High',
        parentId: 'i2',
        storyPoints: 2,
        position: '0|200000:',
        rowVersion: 1,
        labels: [],
        commentCount: 0,
        attachmentCount: 0,
        subtaskCount: 0,
        reporterId: '22222222-2222-2222-2222-222222222222',
        reporterName: 'Sarah Product Manager',
        assigneeId: '11111111-1111-1111-1111-111111111111',
        assigneeName: 'Alex Developer',
        assigneeAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'sub-3',
        projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        issueNumber: 7,
        issueKey: 'TF-7',
        title: 'Implement LexoRank reordering algorithm',
        description: 'Compute fractional midpoints between issue cards during column drops.',
        typeId: 't5',
        typeName: 'Sub-task',
        typeIconName: 'bars-3-bottom-left',
        typeCategory: 'Subtask',
        statusId: 's3',
        statusName: 'In Progress',
        statusColorHex: '#f59e0b',
        isCompletedStatus: false,
        priority: 'High',
        parentId: 'i2',
        storyPoints: 2,
        position: '0|300000:',
        rowVersion: 1,
        labels: [],
        commentCount: 0,
        attachmentCount: 0,
        subtaskCount: 0,
        reporterId: '22222222-2222-2222-2222-222222222222',
        reporterName: 'Sarah Product Manager',
        assigneeId: '11111111-1111-1111-1111-111111111111',
        assigneeName: 'Alex Developer',
        assigneeAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        updatedAt: new Date(Date.now() - 43200000).toISOString()
      }
    ],
    comments: [],
    attachments: [
      {
        id: 'att-1',
        issueId: 'i2',
        userId: '22222222-2222-2222-2222-222222222222',
        userName: 'Sarah Product Manager',
        fileName: 'kanban-spec.pdf',
        filePath: 'attachments/TF-2/kanban-spec.pdf',
        downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileSizeBytes: 245760,
        contentType: 'application/pdf',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'att-2',
        issueId: 'i2',
        userId: '33333333-3333-3333-3333-333333333333',
        userName: 'John Designer',
        fileName: 'board-mockup-v2.png',
        filePath: 'attachments/TF-2/board-mockup-v2.png',
        downloadUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        fileSizeBytes: 843210,
        contentType: 'image/png',
        createdAt: new Date(Date.now() - 43200000).toISOString()
      }
    ],
    activityLogs: []
  },
  {
    id: 'i3',
    projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    issueNumber: 3,
    issueKey: 'TF-3',
    title: 'Refine Glassmorphic Design System & Micro-Animations',
    description: 'Craft dark theme tokens, responsive layouts, subtle glowing indicators, and fluid typography.',
    typeId: 't2',
    typeName: 'Story',
    typeIconName: 'check-circle',
    typeCategory: 'Story',
    statusId: 's4',
    statusName: 'In Review',
    statusColorHex: '#a855f7',
    isCompletedStatus: false,
    priority: 'Medium',
    assigneeId: '33333333-3333-3333-3333-333333333333',
    assigneeName: 'John Designer',
    assigneeAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    reporterId: '22222222-2222-2222-2222-222222222222',
    reporterName: 'Sarah Product Manager',
    sprintId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sprintName: 'Sprint 1 - Core Foundations',
    storyPoints: 3,
    position: '0|300000:',
    rowVersion: 1,
    labels: [{ id: 'l3', projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'UI/UX', colorHex: '#ec4899' }],
    commentCount: 0,
    attachmentCount: 0,
    subtaskCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [],
    comments: [],
    attachments: [],
    activityLogs: []
  },
  {
    id: 'i4',
    projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    issueNumber: 4,
    issueKey: 'TF-4',
    title: 'Sprint Backlog Management & Velocity Tracking',
    description: 'Allow moving issues between Backlog and Sprint containers with active/planned state transitions.',
    typeId: 't3',
    typeName: 'Task',
    typeIconName: 'clipboard-document-list',
    typeCategory: 'Task',
    statusId: 's2',
    statusName: 'To Do',
    statusColorHex: '#38bdf8',
    isCompletedStatus: false,
    priority: 'High',
    assigneeId: '11111111-1111-1111-1111-111111111111',
    assigneeName: 'Alex Developer',
    assigneeAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    reporterId: '22222222-2222-2222-2222-222222222222',
    reporterName: 'Sarah Product Manager',
    sprintId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sprintName: 'Sprint 1 - Core Foundations',
    storyPoints: 5,
    position: '0|400000:',
    rowVersion: 1,
    labels: [{ id: 'l2', projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Backend', colorHex: '#10b981' }],
    commentCount: 0,
    attachmentCount: 0,
    subtaskCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [],
    comments: [],
    attachments: [],
    activityLogs: []
  }
];

let mockNotifications: Notification[] = [
  {
    id: 'n1',
    recipientId: '11111111-1111-1111-1111-111111111111',
    senderId: '22222222-2222-2222-2222-222222222222',
    senderName: 'Sarah Product Manager',
    senderAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    type: 'IssueAssigned',
    title: 'Assigned to TF-2',
    message: 'Sarah assigned you to TF-2: Implement Interactive Kanban Drag-and-Drop Board',
    linkUrl: 'TF-2',
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60000).toISOString()
  },
  {
    id: 'n2',
    recipientId: '11111111-1111-1111-1111-111111111111',
    senderId: '33333333-3333-3333-3333-333333333333',
    senderName: 'John Designer',
    senderAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    type: 'CommentAdded',
    title: 'New comment on TF-3',
    message: 'John commented: "Refined glassmorphic tokens and micro-animations look stunning!"',
    linkUrl: 'TF-3',
    isRead: false,
    createdAt: new Date(Date.now() - 60 * 60000).toISOString()
  },
  {
    id: 'n3',
    recipientId: '11111111-1111-1111-1111-111111111111',
    senderId: '22222222-2222-2222-2222-222222222222',
    senderName: 'Sarah Product Manager',
    senderAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    type: 'IssueStatusChanged',
    title: 'Status changed on TF-1',
    message: 'Sarah moved TF-1 from "In Review" to "Done".',
    linkUrl: 'TF-1',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString()
  }
];

let mockLinks: IssueLink[] = [
  {
    id: 'link-1',
    sourceIssueId: 'i2',
    sourceIssueKey: 'TF-2',
    sourceTitle: 'Implement Interactive Kanban Drag-and-Drop Board',
    targetIssueId: 'i1',
    targetIssueKey: 'TF-1',
    targetTitle: 'Setup Supabase JWT Bearer Auth & Clean Architecture',
    targetStatusName: 'Done',
    targetStatusColorHex: '#10b981',
    linkType: 'IsBlockedBy',
    relationshipText: 'is blocked by',
    createdBy: '22222222-2222-2222-2222-222222222222',
    creatorName: 'Sarah Product Manager',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'link-2',
    sourceIssueId: 'i2',
    sourceIssueKey: 'TF-2',
    sourceTitle: 'Implement Interactive Kanban Drag-and-Drop Board',
    targetIssueId: 'i3',
    targetIssueKey: 'TF-3',
    targetTitle: 'Refine Glassmorphic Design System & Micro-Animations',
    targetStatusName: 'In Review',
    targetStatusColorHex: '#a855f7',
    linkType: 'RelatesTo',
    relationshipText: 'relates to',
    createdBy: '11111111-1111-1111-1111-111111111111',
    creatorName: 'Alex Developer',
    createdAt: new Date(Date.now() - 43200000).toISOString()
  }
];

let mockWatchers: Record<string, IssueWatcher[]> = {
  i2: [
    {
      userId: '22222222-2222-2222-2222-222222222222',
      fullName: 'Sarah Product Manager',
      email: 'sarah.pm@taskflow.dev',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      createdAt: new Date().toISOString()
    },
    {
      userId: '33333333-3333-3333-3333-333333333333',
      fullName: 'John Designer',
      email: 'john.designer@taskflow.dev',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      createdAt: new Date().toISOString()
    }
  ]
};

export const api = {
  // Projects
  async getProjects(): Promise<Project[]> {
    try {
      const res = await authFetch(`${API_BASE}/projects`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return mockProjects;
  },

  async getProjectByKey(key: string): Promise<ProjectDetail> {
    try {
      const res = await authFetch(`${API_BASE}/projects/by-key/${key}`);
      if (res.ok) return await res.json();
    } catch (_) {}
    const p = mockProjects.find(x => x.key.toLowerCase() === key.toLowerCase()) || mockProjects[0];
    return p;
  },

  async createProject(data: { name: string; key: string; description?: string }): Promise<ProjectDetail> {
    try {
      const res = await authFetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const newProj: ProjectDetail = {
      id: crypto.randomUUID(),
      name: data.name,
      key: data.key.toUpperCase(),
      description: data.description,
      leadId: '11111111-1111-1111-1111-111111111111',
      leadName: 'Alex Developer',
      leadAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      issueCounter: 0,
      isArchived: false,
      memberCount: 1,
      issueCount: 0,
      createdAt: new Date().toISOString(),
      members: [
        {
          id: crypto.randomUUID(),
          projectId: '',
          userId: '11111111-1111-1111-1111-111111111111',
          email: 'alex.developer@taskflow.dev',
          fullName: 'Alex Developer',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
          role: 'Owner',
          joinedAt: new Date().toISOString()
        }
      ],
      issueTypes: mockProjects[0].issueTypes,
      issueStatuses: mockProjects[0].issueStatuses,
      labels: mockProjects[0].labels
    };
    newProj.members[0].projectId = newProj.id;
    mockProjects.unshift(newProj);
    return newProj;
  },

  // Sprints
  async getSprints(projectId: string): Promise<Sprint[]> {
    try {
      const res = await authFetch(`${API_BASE}/projects/${projectId}/sprints`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return mockSprints.filter(s => s.projectId === projectId);
  },

  async createSprint(projectId: string, data: { name: string; goal?: string; startDate?: string; endDate?: string }): Promise<Sprint> {
    try {
      const res = await authFetch(`${API_BASE}/projects/${projectId}/sprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const sprint: Sprint = {
      id: crypto.randomUUID(),
      projectId,
      name: data.name,
      goal: data.goal,
      status: 'Planned',
      startDate: data.startDate,
      endDate: data.endDate,
      issueCount: 0,
      totalStoryPoints: 0,
      completedStoryPoints: 0,
      createdAt: new Date().toISOString()
    };
    mockSprints.push(sprint);
    return sprint;
  },

  async startSprint(id: string): Promise<Sprint> {
    try {
      const res = await authFetch(`${API_BASE}/sprints/${id}/start`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (_) {}

    const s = mockSprints.find(x => x.id === id);
    if (s) {
      s.status = 'Active';
      s.startDate = new Date().toISOString();
      s.endDate = new Date(Date.now() + 14 * 86400000).toISOString();
    }
    return s!;
  },

  async completeSprint(id: string, targetSprintId?: string): Promise<Sprint> {
    try {
      const res = await authFetch(`${API_BASE}/sprints/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetSprintId })
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const s = mockSprints.find(x => x.id === id);
    if (s) {
      s.status = 'Completed';
      s.completedAt = new Date().toISOString();
      mockIssues.forEach(i => {
        if (i.sprintId === id && !i.isCompletedStatus) {
          i.sprintId = targetSprintId || undefined;
          i.sprintName = targetSprintId ? mockSprints.find(ms => ms.id === targetSprintId)?.name : undefined;
        }
      });
    }
    return s!;
  },

  // Issues
  async getIssues(projectId: string, options?: { sprintId?: string; backlogOnly?: boolean }): Promise<Issue[]> {
    try {
      const params = new URLSearchParams({ projectId });
      if (options?.sprintId) params.append('sprintId', options.sprintId);
      if (options?.backlogOnly) params.append('backlogOnly', 'true');
      const res = await authFetch(`${API_BASE}/issues?${params}`);
      if (res.ok) {
        const json = await res.json();
        return json.items || json;
      }
    } catch (_) {}

    let list = mockIssues.filter(i => i.projectId === projectId);
    if (options?.backlogOnly) {
      list = list.filter(i => !i.sprintId);
    } else if (options?.sprintId) {
      list = list.filter(i => i.sprintId === options.sprintId);
    }
    return list;
  },

  async createIssue(data: {
    projectId: string;
    title: string;
    description?: string;
    typeId: string;
    statusId?: string;
    priority?: IssuePriority;
    assigneeId?: string;
    sprintId?: string;
    parentId?: string;
    storyPoints?: number;
  }): Promise<IssueDetail> {
    try {
      const res = await authFetch(`${API_BASE}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const project = mockProjects.find(p => p.id === data.projectId) || mockProjects[0];
    project.issueCounter += 1;
    const type = project.issueTypes.find(t => t.id === data.typeId) || project.issueTypes[1];
    const status = project.issueStatuses.find(s => s.id === data.statusId) || project.issueStatuses[1];
    const assignee = project.members.find(m => m.userId === data.assigneeId);

    const newIssue: IssueDetail = {
      id: crypto.randomUUID(),
      projectId: project.id,
      issueNumber: project.issueCounter,
      issueKey: `${project.key}-${project.issueCounter}`,
      title: data.title,
      description: data.description,
      typeId: type.id,
      typeName: type.name,
      typeIconName: type.iconName,
      typeCategory: type.category,
      statusId: status.id,
      statusName: status.name,
      statusColorHex: status.colorHex,
      isCompletedStatus: status.isCompletedStatus,
      priority: data.priority || 'Medium',
      assigneeId: assignee?.userId,
      assigneeName: assignee?.fullName,
      assigneeAvatarUrl: assignee?.avatarUrl,
      reporterId: '11111111-1111-1111-1111-111111111111',
      reporterName: 'Alex Developer',
      sprintId: data.sprintId,
      parentId: data.parentId,
      storyPoints: data.storyPoints,
      position: `0|${Date.now().toString(36)}:`,
      rowVersion: 1,
      labels: [],
      commentCount: 0,
      attachmentCount: 0,
      subtaskCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subtasks: [],
      comments: [],
      attachments: [],
      activityLogs: [
        {
          id: crypto.randomUUID(),
          issueId: '',
          userId: '11111111-1111-1111-1111-111111111111',
          userName: 'Alex Developer',
          activityType: 'Created',
          newValue: data.title,
          createdAt: new Date().toISOString()
        }
      ]
    };
    newIssue.activityLogs[0].issueId = newIssue.id;

    if (data.parentId) {
      const parent = mockIssues.find(i => i.id === data.parentId);
      if (parent) {
        if (!parent.subtasks) parent.subtasks = [];
        parent.subtasks.push(newIssue);
        parent.subtaskCount = parent.subtasks.length;
      }
    }

    mockIssues.push(newIssue);
    project.issueCount += 1;
    return newIssue;
  },

  async moveIssue(id: string, data: { targetStatusId?: string; targetSprintId?: string; updateSprint?: boolean }): Promise<Issue> {
    try {
      const res = await authFetch(`${API_BASE}/issues/${id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const issue = mockIssues.find(i => i.id === id);
    if (issue) {
      if (data.targetStatusId) {
        const project = mockProjects.find(p => p.id === issue.projectId);
        const s = project?.issueStatuses.find(st => st.id === data.targetStatusId);
        if (s) {
          issue.statusId = s.id;
          issue.statusName = s.name;
          issue.statusColorHex = s.colorHex;
          issue.isCompletedStatus = s.isCompletedStatus;
        }
      }
      if (data.updateSprint) {
        issue.sprintId = data.targetSprintId;
      }
      issue.updatedAt = new Date().toISOString();
    }
    return issue!;
  },

  async updateIssue(id: string, updates: Partial<IssueDetail>): Promise<IssueDetail> {
    try {
      const res = await authFetch(`${API_BASE}/issues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const issue = mockIssues.find(i => i.id === id);
    if (issue) {
      Object.assign(issue, updates);
      issue.updatedAt = new Date().toISOString();

      // If this issue is a subtask, also sync within parent issue's subtasks list
      if (issue.parentId) {
        const parent = mockIssues.find(p => p.id === issue.parentId);
        if (parent && parent.subtasks) {
          parent.subtasks = parent.subtasks.map(s => s.id === id ? { ...s, ...updates } : s);
        }
      }
    }
    return issue!;
  },

  async deleteIssue(id: string): Promise<boolean> {
    try {
      const res = await authFetch(`${API_BASE}/issues/${id}`, { method: 'DELETE' });
      if (res.ok) return true;
    } catch (_) {}

    const issueToDelete = mockIssues.find(i => i.id === id);
    if (issueToDelete?.parentId) {
      const parent = mockIssues.find(p => p.id === issueToDelete.parentId);
      if (parent && parent.subtasks) {
        parent.subtasks = parent.subtasks.filter(s => s.id !== id);
        parent.subtaskCount = parent.subtasks.length;
      }
    }

    mockIssues = mockIssues.filter(i => i.id !== id);
    return true;
  },

  // Attachments
  async getAttachments(issueId: string): Promise<Attachment[]> {
    try {
      const res = await authFetch(`${API_BASE}/issues/${issueId}/attachments`);
      if (res.ok) return await res.json();
    } catch (_) {}

    const issue = mockIssues.find(i => i.id === issueId);
    return issue?.attachments || [];
  },

  async createAttachment(issueId: string, data: {
    fileName: string;
    filePath: string;
    fileSizeBytes: number;
    contentType: string;
    downloadUrl?: string;
  }): Promise<Attachment> {
    try {
      const res = await authFetch(`${API_BASE}/issues/${issueId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const newAttachment: Attachment = {
      id: crypto.randomUUID(),
      issueId,
      userId: '11111111-1111-1111-1111-111111111111',
      userName: 'Alex Developer',
      fileName: data.fileName,
      filePath: data.filePath,
      downloadUrl: data.downloadUrl || data.filePath,
      fileSizeBytes: data.fileSizeBytes,
      contentType: data.contentType,
      createdAt: new Date().toISOString()
    };

    const issue = mockIssues.find(i => i.id === issueId);
    if (issue) {
      if (!issue.attachments) issue.attachments = [];
      issue.attachments.push(newAttachment);
      issue.attachmentCount = issue.attachments.length;
    }

    return newAttachment;
  },

  async deleteAttachment(issueId: string, attachmentId: string): Promise<boolean> {
    try {
      const res = await authFetch(`${API_BASE}/attachments/${attachmentId}`, {
        method: 'DELETE'
      });
      if (res.ok) return true;
    } catch (_) {}

    const issue = mockIssues.find(i => i.id === issueId);
    if (issue && issue.attachments) {
      issue.attachments = issue.attachments.filter(a => a.id !== attachmentId);
      issue.attachmentCount = issue.attachments.length;
    }
    return true;
  },

  // Comments
  async addComment(issueId: string, content: string): Promise<Comment> {
    try {
      const res = await authFetch(`${API_BASE}/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const comment: Comment = {
      id: crypto.randomUUID(),
      issueId,
      userId: '11111111-1111-1111-1111-111111111111',
      userName: 'Alex Developer',
      userAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const issue = mockIssues.find(i => i.id === issueId);
    if (issue) {
      issue.comments.push(comment);
      issue.commentCount += 1;
    }
    return comment;
  },

  // Members
  async addMember(projectId: string, email: string, role: ProjectRole): Promise<ProjectMember> {
    try {
      const res = await authFetch(`${API_BASE}/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, email, role })
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const name = email.split('@')[0];
    const member: ProjectMember = {
      id: crypto.randomUUID(),
      projectId,
      userId: crypto.randomUUID(),
      email,
      fullName: name.charAt(0).toUpperCase() + name.slice(1),
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      role,
      joinedAt: new Date().toISOString()
    };

    const proj = mockProjects.find(p => p.id === projectId);
    if (proj) {
      proj.members.push(member);
      proj.memberCount += 1;
    }
    return member;
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    try {
      const res = await authFetch(`${API_BASE}/notifications`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return mockNotifications;
  },

  async markNotificationAsRead(id: string): Promise<boolean> {
    try {
      const res = await authFetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' });
      if (res.ok) return true;
    } catch (_) {}
    const notif = mockNotifications.find(n => n.id === id);
    if (notif) notif.isRead = true;
    return true;
  },

  async markAllNotificationsAsRead(): Promise<boolean> {
    try {
      const res = await authFetch(`${API_BASE}/notifications/read-all`, { method: 'PUT' });
      if (res.ok) return true;
    } catch (_) {}
    mockNotifications.forEach(n => { n.isRead = true; });
    return true;
  },

  // Issue Links
  async getIssueLinks(issueId: string): Promise<IssueLink[]> {
    try {
      const res = await authFetch(`${API_BASE}/issues/${issueId}/links`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return mockLinks.filter(l => l.sourceIssueId === issueId || l.targetIssueId === issueId);
  },

  async createIssueLink(issueId: string, data: { targetIssueId: string; linkType: IssueLinkType }): Promise<IssueLink> {
    try {
      const res = await authFetch(`${API_BASE}/issues/${issueId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const source = mockIssues.find(i => i.id === issueId);
    const target = mockIssues.find(i => i.id === data.targetIssueId);
    
    const relTextMap: Record<IssueLinkType, string> = {
      'Blocks': 'blocks',
      'IsBlockedBy': 'is blocked by',
      'RelatesTo': 'relates to',
      'Duplicates': 'duplicates'
    };

    const newLink: IssueLink = {
      id: crypto.randomUUID(),
      sourceIssueId: issueId,
      sourceIssueKey: source?.issueKey || 'TF-?',
      sourceTitle: source?.title || 'Unknown',
      targetIssueId: data.targetIssueId,
      targetIssueKey: target?.issueKey || 'TF-?',
      targetTitle: target?.title || 'Unknown',
      targetStatusName: target?.statusName || 'To Do',
      targetStatusColorHex: target?.statusColorHex || '#38bdf8',
      linkType: data.linkType,
      relationshipText: relTextMap[data.linkType] || 'relates to',
      createdBy: '11111111-1111-1111-1111-111111111111',
      creatorName: 'Alex Developer',
      createdAt: new Date().toISOString()
    };

    mockLinks.push(newLink);
    return newLink;
  },

  async deleteIssueLink(issueId: string, linkId: string): Promise<boolean> {
    try {
      const res = await authFetch(`${API_BASE}/issues/${issueId}/links/${linkId}`, {
        method: 'DELETE'
      });
      if (res.ok) return true;
    } catch (_) {}

    mockLinks = mockLinks.filter(l => l.id !== linkId);
    return true;
  },

  // Issue Watchers
  async getIssueWatchers(issueId: string): Promise<IssueWatcher[]> {
    try {
      const res = await authFetch(`${API_BASE}/issues/${issueId}/watchers`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return mockWatchers[issueId] || [];
  },

  async toggleIssueWatcher(issueId: string): Promise<boolean> {
    try {
      const res = await authFetch(`${API_BASE}/issues/${issueId}/watchers/toggle`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        return data.isWatching;
      }
    } catch (_) {}

    const currentWatchers = mockWatchers[issueId] || [];
    const alexUserId = '11111111-1111-1111-1111-111111111111';
    const isAlexWatching = currentWatchers.some(w => w.userId === alexUserId);

    if (isAlexWatching) {
      mockWatchers[issueId] = currentWatchers.filter(w => w.userId !== alexUserId);
      return false;
    } else {
      mockWatchers[issueId] = [
        ...currentWatchers,
        {
          userId: alexUserId,
          fullName: 'Alex Developer',
          email: 'alex.developer@taskflow.dev',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
          createdAt: new Date().toISOString()
        }
      ];
      return true;
    }
  },

  // Saved Filters
  async getSavedFilters(projectId?: string): Promise<any[]> {
    try {
      const url = projectId ? `${API_BASE}/saved-filters?projectId=${projectId}` : `${API_BASE}/saved-filters`;
      const res = await authFetch(url);
      if (res.ok) return await res.json();
    } catch (_) {}
    return [];
  },

  async createSavedFilter(data: { name: string; filterQuery: string; projectId?: string; isFavorite?: boolean }): Promise<any> {
    try {
      const res = await authFetch(`${API_BASE}/saved-filters`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return null;
  },

  async deleteSavedFilter(id: string): Promise<boolean> {
    try {
      const res = await authFetch(`${API_BASE}/saved-filters/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) return true;
    } catch (_) {}
    return true;
  },

  // Workflow Transitions (Phase 6)
  async getWorkflowTransitions(projectId: string): Promise<WorkflowTransition[]> {
    try {
      const res = await authFetch(`${API_BASE}/projects/${projectId}/workflow-transitions`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return [
      { id: 'wt-1', projectId, fromStatusId: 's1', fromStatusName: 'Backlog', fromStatusColorHex: '#64748b', toStatusId: 's2', toStatusName: 'To Do', toStatusColorHex: '#38bdf8', name: 'Move to To Do' },
      { id: 'wt-2', projectId, fromStatusId: 's2', fromStatusName: 'To Do', fromStatusColorHex: '#38bdf8', toStatusId: 's3', toStatusName: 'In Progress', toStatusColorHex: '#f59e0b', name: 'Start Progress' },
      { id: 'wt-3', projectId, fromStatusId: 's3', fromStatusName: 'In Progress', fromStatusColorHex: '#f59e0b', toStatusId: 's4', toStatusName: 'In Review', toStatusColorHex: '#a855f7', name: 'Submit Review' },
      { id: 'wt-4', projectId, fromStatusId: 's4', fromStatusName: 'In Review', fromStatusColorHex: '#a855f7', toStatusId: 's3', toStatusName: 'In Progress', toStatusColorHex: '#f59e0b', name: 'Request Changes' },
      { id: 'wt-5', projectId, fromStatusId: 's4', fromStatusName: 'In Review', fromStatusColorHex: '#a855f7', toStatusId: 's5', toStatusName: 'Done', toStatusColorHex: '#10b981', name: 'Approve & Complete' }
    ];
  },

  async createWorkflowTransition(projectId: string, data: { fromStatusId: string; toStatusId: string; name?: string }): Promise<WorkflowTransition> {
    const res = await authFetch(`${API_BASE}/projects/${projectId}/workflow-transitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) return await res.json();
    throw new Error('Failed to create workflow transition');
  },

  async deleteWorkflowTransition(id: string): Promise<boolean> {
    const res = await authFetch(`${API_BASE}/workflow-transitions/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // Work Logs / Time Tracking (Phase 6)
  async getWorkLogs(issueId: string): Promise<WorkLog[]> {
    try {
      const res = await authFetch(`${API_BASE}/issues/${issueId}/work-logs`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return [];
  },

  async createWorkLog(issueId: string, data: { timeSpentMinutes: number; startedAt?: string; description?: string }): Promise<WorkLog> {
    const res = await authFetch(`${API_BASE}/issues/${issueId}/work-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) return await res.json();
    throw new Error('Failed to log work');
  },

  async deleteWorkLog(issueId: string, workLogId: string): Promise<boolean> {
    const res = await authFetch(`${API_BASE}/issues/${issueId}/work-logs/${workLogId}`, { method: 'DELETE' });
    return res.ok;
  },

  // Agile Reports (Phase 6)
  async getSprintBurndown(sprintId: string): Promise<SprintBurndown> {
    try {
      const res = await authFetch(`${API_BASE}/sprints/${sprintId}/burndown`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      sprintId,
      sprintName: 'Sprint 1',
      totalStoryPoints: 16,
      totalIssues: 4,
      dataPoints: [
        { date: 'Day 1', idealStoryPoints: 16, remainingStoryPoints: 16, remainingIssues: 4 },
        { date: 'Day 3', idealStoryPoints: 13.7, remainingStoryPoints: 16, remainingIssues: 4 },
        { date: 'Day 5', idealStoryPoints: 11.4, remainingStoryPoints: 13, remainingIssues: 3 },
        { date: 'Day 8', idealStoryPoints: 8.0, remainingStoryPoints: 13, remainingIssues: 3 },
        { date: 'Day 14', idealStoryPoints: 0, remainingStoryPoints: 13, remainingIssues: 3 }
      ]
    };
  },

  async getProjectVelocity(projectId: string): Promise<SprintVelocity[]> {
    try {
      const res = await authFetch(`${API_BASE}/projects/${projectId}/velocity`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return [
      { sprintId: 's-prev', sprintName: 'Sprint 0 - Onboarding', committedStoryPoints: 12, completedStoryPoints: 12, completedAt: new Date(Date.now() - 14 * 86400000).toISOString() },
      { sprintId: 's-cur', sprintName: 'Sprint 1 - Core Foundations', committedStoryPoints: 16, completedStoryPoints: 3 }
    ];
  },

  async getWorkloadDistribution(projectId: string, sprintId?: string): Promise<MemberWorkload[]> {
    try {
      const url = sprintId ? `${API_BASE}/projects/${projectId}/workload?sprintId=${sprintId}` : `${API_BASE}/projects/${projectId}/workload`;
      const res = await authFetch(url);
      if (res.ok) return await res.json();
    } catch (_) {}
    return [
      { userId: '11111111-1111-1111-1111-111111111111', userName: 'Alex Developer', userAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', issueCount: 3, totalStoryPoints: 13, completedStoryPoints: 3, completedIssueCount: 1 },
      { userId: '33333333-3333-3333-3333-333333333333', userName: 'John Designer', userAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', issueCount: 1, totalStoryPoints: 3, completedStoryPoints: 0, completedIssueCount: 0 }
    ];
  },

  // CSV Import & Export (Phase 6)
  async exportCsv(projectId: string, sprintId?: string): Promise<Blob> {
    const url = sprintId ? `${API_BASE}/projects/${projectId}/export-csv?sprintId=${sprintId}` : `${API_BASE}/projects/${projectId}/export-csv`;
    const res = await authFetch(url);
    if (!res.ok) throw new Error('Export CSV failed');
    return await res.blob();
  },

  async importCsv(projectId: string, csvContent: string): Promise<ImportResult> {
    const res = await authFetch(`${API_BASE}/projects/${projectId}/import-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvContent })
    });
    if (res.ok) return await res.json();
    throw new Error('Import CSV failed');
  }
};

