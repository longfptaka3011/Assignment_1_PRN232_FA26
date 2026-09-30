export type ProjectRole = 'Owner' | 'Admin' | 'Member' | 'Viewer';
export type SprintStatus = 'Planned' | 'Active' | 'Completed';
export type IssuePriority = 'Lowest' | 'Low' | 'Medium' | 'High' | 'Urgent';
export type IssueTypeCategory = 'Epic' | 'Story' | 'Task' | 'Bug' | 'Subtask';
export type NotificationType = 'IssueAssigned' | 'IssueStatusChanged' | 'IssueMentioned' | 'CommentAdded' | 'ProjectInvited';
export type ActivityType = 'Created' | 'Updated' | 'StatusChanged' | 'Assigned' | 'SprintChanged' | 'PriorityChanged' | 'CommentAdded' | 'AttachmentAdded' | 'AttachmentRemoved' | 'CommentRemoved' | 'Deleted';

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Label {
  id: string;
  projectId: string;
  name: string;
  colorHex: string;
}

export interface IssueStatus {
  id: string;
  projectId: string;
  name: string;
  colorHex: string;
  orderIndex: number;
  isCompletedStatus: boolean;
}

export interface IssueType {
  id: string;
  projectId: string;
  name: string;
  iconName: string;
  category: IssueTypeCategory;
  orderIndex: number;
  isSubtask: boolean;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: ProjectRole;
  joinedAt: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  leadId: string;
  leadName: string;
  leadAvatarUrl?: string;
  issueCounter: number;
  isArchived: boolean;
  memberCount: number;
  issueCount: number;
  createdAt: string;
}

export interface ProjectDetail extends Project {
  members: ProjectMember[];
  issueTypes: IssueType[];
  issueStatuses: IssueStatus[];
  labels: Label[];
}

export interface Issue {
  id: string;
  projectId: string;
  issueNumber: number;
  issueKey: string;
  title: string;
  description?: string;
  typeId: string;
  typeName: string;
  typeIconName: string;
  typeCategory: IssueTypeCategory;
  statusId: string;
  statusName: string;
  statusColorHex: string;
  isCompletedStatus: boolean;
  priority: IssuePriority;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatarUrl?: string;
  reporterId: string;
  reporterName: string;
  reporterAvatarUrl?: string;
  sprintId?: string;
  sprintName?: string;
  parentId?: string;
  storyPoints?: number;
  position: string;
  dueDate?: string;
  rowVersion: number;
  labels: Label[];
  commentCount: number;
  attachmentCount: number;
  subtaskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  fileName: string;
  filePath: string;
  downloadUrl: string;
  fileSizeBytes: number;
  contentType: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  activityType: ActivityType;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export type IssueLinkType = 'Blocks' | 'IsBlockedBy' | 'RelatesTo' | 'Duplicates';

export interface IssueLink {
  id: string;
  sourceIssueId: string;
  sourceIssueKey: string;
  sourceTitle: string;
  targetIssueId: string;
  targetIssueKey: string;
  targetTitle: string;
  targetStatusName: string;
  targetStatusColorHex: string;
  linkType: IssueLinkType;
  relationshipText: string;
  createdBy: string;
  creatorName: string;
  createdAt: string;
}

export interface IssueWatcher {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface IssueDetail extends Issue {
  subtasks: Issue[];
  comments: Comment[];
  attachments: Attachment[];
  activityLogs: ActivityLog[];
  links?: IssueLink[];
  watchers?: IssueWatcher[];
  isWatching?: boolean;
  workLogs?: WorkLog[];
  totalTimeSpentMinutes?: number;
  originalEstimateHours?: number;
  remainingEstimateHours?: number;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  status: SprintStatus;
  startDate?: string;
  endDate?: string;
  completedAt?: string;
  issueCount: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  createdAt: string;
}

export interface SprintDetail extends Sprint {
  issues: Issue[];
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface WorkflowTransition {
  id: string;
  projectId: string;
  fromStatusId: string;
  fromStatusName: string;
  fromStatusColorHex: string;
  toStatusId: string;
  toStatusName: string;
  toStatusColorHex: string;
  name?: string;
}

export interface WorkLog {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  timeSpentMinutes: number;
  startedAt: string;
  description?: string;
  createdAt: string;
}

export interface BurndownDataPoint {
  date: string;
  idealStoryPoints: number;
  remainingStoryPoints: number;
  remainingIssues: number;
}

export interface SprintBurndown {
  sprintId: string;
  sprintName: string;
  totalStoryPoints: number;
  totalIssues: number;
  dataPoints: BurndownDataPoint[];
}

export interface SprintVelocity {
  sprintId: string;
  sprintName: string;
  committedStoryPoints: number;
  completedStoryPoints: number;
  completedAt?: string;
}

export interface MemberWorkload {
  userId?: string;
  userName: string;
  userAvatarUrl?: string;
  issueCount: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  completedIssueCount: number;
}

export interface ImportResult {
  totalProcessed: number;
  importedCount: number;
  importedKeys: string[];
  errors: string[];
}

