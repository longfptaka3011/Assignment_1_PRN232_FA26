import { create } from 'zustand';

export type Language = 'en' | 'vi';
export type ThemeMode = 'dark' | 'light';

export const translations = {
  en: {
    // Nav
    appName: 'TaskFlow',
    switchProject: 'Switch Project',
    searchPlaceholder: 'Search issues, keys, or descriptions...',
    createIssue: 'Create Issue',
    notifications: 'Notifications',
    markAllRead: 'Mark all read',
    noNotifications: 'No notifications',
    logOut: 'Log Out',
    demoAccount: 'Demo Account',
    
    // Sidebar
    kanbanBoard: 'Kanban Board',
    backlogSprints: 'Backlog & Sprints',
    reports: 'Agile Reports',
    teamSettings: 'Team & Settings',
    onlyMyIssues: 'Only My Issues',
    sprintProgress: 'Points Delivered',
    exportImportCsv: 'Import / Export CSV',

    // Kanban
    sprintBoard: 'Sprint Board',
    boardSubtitle: 'Track, update, and manage tasks across your agile development workflow.',
    activeIssues: 'active issues',
    addIssue: 'Add issue',
    noIssues: 'No issues',

    // Backlog
    backlogPlanning: 'Backlog & Sprint Planning',
    backlogSubtitle: 'Organize iterations, plan sprints, and estimate user story capacity.',
    createSprint: 'Create Sprint',
    startSprint: 'Start Sprint',
    completeSprint: 'Complete Sprint',
    backlog: 'Backlog',
    moveToBacklog: 'Move to Backlog',
    moveToSprint: 'Move to Sprint...',
    emptyBacklog: 'Your backlog is empty. Great job!',

    // Issue Modal
    subtasks: 'Sub-tasks',
    completed: 'completed',
    addSubtask: 'Add a sub-task...',
    attachments: 'Attachments',
    dropFiles: 'Click or drag files here to attach',
    dropFilesHint: 'Supports images, PDF, documents, ZIP up to 10MB',
    comments: 'Comments',
    activity: 'Activity History',
    noComments: 'No comments yet. Start the conversation below.',
    addCommentPlaceholder: 'Add a comment...',
    post: 'Post',
    linkedIssues: 'Linked Issues',
    linkIssue: 'Link Issue',
    watch: 'Watch',
    watching: 'Watching',
    status: 'Status',
    assignee: 'Assignee',
    priority: 'Priority',
    sprint: 'Sprint',
    storyPoints: 'Story Points',
    reporter: 'Reporter',
    created: 'Created',
    updated: 'Updated',
    unassigned: 'Unassigned',
    deleteConfirm: 'Are you sure you want to delete this issue?',

    // Link Types
    relatesTo: 'relates to',
    blocks: 'blocks',
    isBlockedBy: 'is blocked by',
    duplicates: 'duplicates',

    // Time Tracking & Work Logs
    workLogs: 'Work Logs',
    timeTracking: 'Time Tracking',
    originalEstimate: 'Original Estimate',
    timeSpent: 'Time Spent',
    logWork: 'Log Work',
    'nav.reports': 'Agile Reports'
  },
  vi: {
    // Nav
    appName: 'TaskFlow',
    switchProject: 'Chuyển Dự Án',
    searchPlaceholder: 'Tìm kiếm issue, mã, hoặc mô tả...',
    createIssue: 'Tạo Issue',
    notifications: 'Thông Báo',
    markAllRead: 'Đã đọc tất cả',
    noNotifications: 'Không có thông báo mới',
    logOut: 'Đăng Xuất',
    demoAccount: 'Tài khoản Demo',

    // Sidebar
    kanbanBoard: 'Bảng Kanban',
    backlogSprints: 'Backlog & Sprints',
    reports: 'Báo Cáo Agile',
    teamSettings: 'Đội Nhóm & Cài Đặt',
    onlyMyIssues: 'Chỉ Issue Của Tôi',
    sprintProgress: 'Điểm Đã Hoàn Thành',
    exportImportCsv: 'Nhập / Xuất CSV',

    // Kanban
    sprintBoard: 'Bảng Sprint',
    boardSubtitle: 'Theo dõi, cập nhật và quản lý công việc theo quy trình Agile linh hoạt.',
    activeIssues: 'issue đang mở',
    addIssue: 'Thêm issue',
    noIssues: 'Chưa có issue',

    // Backlog
    backlogPlanning: 'Kế Hoạch Sprint & Backlog',
    backlogSubtitle: 'Tổ chức các chu kỳ phát triển, chia sprint và ước lượng story points.',
    createSprint: 'Tạo Sprint',
    startSprint: 'Bắt Đầu Sprint',
    completeSprint: 'Hoàn Thành Sprint',
    backlog: 'Backlog',
    moveToBacklog: 'Chuyển về Backlog',
    moveToSprint: 'Chuyển sang Sprint...',
    emptyBacklog: 'Backlog đang trống. Tuyệt vời!',

    // Issue Modal
    subtasks: 'Nhiệm Vụ Phụ (Sub-tasks)',
    completed: 'hoàn thành',
    addSubtask: 'Thêm nhiệm vụ phụ...',
    attachments: 'Tệp Đính Kèm',
    dropFiles: 'Nhấp hoặc kéo thả file vào đây để đính kèm',
    dropFilesHint: 'Hỗ trợ ảnh, PDF, tài liệu, file ZIP tối đa 10MB',
    comments: 'Bình Luận',
    activity: 'Nhật Ký Hoạt Động',
    noComments: 'Chưa có bình luận nào. Hãy bắt đầu thảo luận bên dưới.',
    addCommentPlaceholder: 'Viết bình luận...',
    post: 'Gửi',
    linkedIssues: 'Issue Liên Kết',
    linkIssue: 'Liên Kết Issue',
    watch: 'Theo dõi',
    watching: 'Đang theo dõi',
    status: 'Trạng Thái',
    assignee: 'Người Thực Hiện',
    priority: 'Độ Ưu Tiên',
    sprint: 'Sprint',
    storyPoints: 'Story Points',
    reporter: 'Người Báo Cáo',
    created: 'Ngày Tạo',
    updated: 'Cập Nhật',
    unassigned: 'Chưa giao',
    deleteConfirm: 'Bạn có chắc chắn muốn xóa issue này không?',

    // Link Types
    relatesTo: 'liên quan tới',
    blocks: 'chặn (blocks)',
    isBlockedBy: 'bị chặn bởi',
    duplicates: 'trùng lặp với',

    // Time Tracking & Work Logs
    workLogs: 'Thời Gian Thực Hiện',
    timeTracking: 'Theo Dõi Thời Gian',
    originalEstimate: 'Ước Lượng Ban Đầu',
    timeSpent: 'Thời Gian Đã Dùng',
    logWork: 'Ghi Thời Gian',
    'nav.reports': 'Báo Cáo Agile'
  }
};

interface ThemeAndLangState {
  theme: ThemeMode;
  lang: Language;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const initialTheme = (localStorage.getItem('taskflow_theme') as ThemeMode) || 'dark';
const initialLang = (localStorage.getItem('taskflow_lang') as Language) || 'vi';

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', initialTheme);
}

export const useThemeAndLang = create<ThemeAndLangState>((set, get) => ({
  theme: initialTheme,
  lang: initialLang,

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('taskflow_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    set({ theme: nextTheme });
  },

  setLanguage: (lang: Language) => {
    localStorage.setItem('taskflow_lang', lang);
    set({ lang });
  },

  t: (key: keyof typeof translations['en']) => {
    const currentLang = get().lang;
    return translations[currentLang][key] || translations['en'][key] || key;
  }
}));

export const useThemeAndLangStore = useThemeAndLang;

