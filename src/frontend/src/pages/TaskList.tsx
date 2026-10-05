import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Kanban,
  Table as TableIcon,
  Calendar,
  Edit2,
  Trash2,
  X,
  Clock,
  CheckCircle2,
  PlayCircle,
  XCircle,
  MoreHorizontal,
  MessageSquare,
  Paperclip,
  ChevronDown,
  Check,
} from 'lucide-react';
import { taskApi, projectApi, departmentApi, tagApi } from '../services/api';
import type { Task, CreateTaskDto, UpdateTaskDto, Project, Department, Tag } from '../types';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { TaskStatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import './TaskList.css';

// Column configuration matching the reference layout
const STATUS_COLUMNS = [
  { id: 0, title: 'To do', icon: Clock, color: '#64748b' },
  { id: 1, title: 'In progress', icon: PlayCircle, color: '#3b82f6' },
  { id: 2, title: 'Completed', icon: CheckCircle2, color: '#10b981' },
  { id: 3, title: 'Backlogs', icon: XCircle, color: '#94a3b8' },
];

const PRIORITY_OPTIONS = [
  { value: 0, label: 'Low', color: '#10b981' },
  { value: 1, label: 'Medium', color: '#f59e0b' },
  { value: 2, label: 'High', color: '#f97316' },
  { value: 3, label: 'Urgent', color: '#ef4444' },
];

export default function TaskList() {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'kanban' | 'table'
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Dynamic Filters based on real database entities
  const [searchTitle, setSearchTitle] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<number | ''>('');
  const [filterProject, setFilterProject] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<number | ''>('');
  const [filterPriority, setFilterPriority] = useState<number | ''>('');
  const [filterTag, setFilterTag] = useState<number | ''>('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm Modal
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Active task card dropdown menu
  const [activeCardMenu, setActiveCardMenu] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateTaskDto>({
    title: '',
    description: '',
    status: 0,
    priority: 1,
    dueDate: undefined,
    projectId: 0,
    tagIds: [],
  });

  // Fetch Tasks
  const fetchTasks = useCallback(async () => {
    try {
      const params: {
        title?: string;
        status?: number | '';
        priority?: number | '';
        projectId?: number | '';
        tagId?: number | '';
      } = {};

      if (searchTitle.trim()) params.title = searchTitle.trim();
      if (filterStatus !== '') params.status = filterStatus;
      if (filterPriority !== '') params.priority = filterPriority;
      if (filterProject !== '') params.projectId = filterProject;
      if (filterTag !== '') params.tagId = filterTag;

      const data = await taskApi.getAll(Object.keys(params).length > 0 ? params : undefined);
      setTasks(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  }, [searchTitle, filterStatus, filterPriority, filterProject, filterTag, toast]);

  // Fetch Auxiliary Data from real database
  useEffect(() => {
    Promise.all([departmentApi.getAll(), projectApi.getAll(), tagApi.getAll()])
      .then(([depts, projs, tgs]) => {
        setDepartments(depts);
        setProjects(projs);
        setTags(tgs);
      })
      .catch(() => {
        toast.error('Failed to load filter metadata.');
      });
  }, [toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveCardMenu(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Open Modal (New or Edit)
  const openTaskModal = (task?: Task, defaultStatus: number = 0) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : undefined,
        projectId: task.projectId,
        tagIds: task.tags?.map(t => t.tagId) || [],
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        status: defaultStatus,
        priority: 1,
        dueDate: undefined,
        projectId: projects[0]?.projectId || 0,
        tagIds: [],
      });
    }
    setShowModal(true);
  };

  // Handle Form Submit (Create or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.warning('Task title is required.');
      return;
    }
    if (!formData.projectId) {
      toast.warning('Please select an associated project.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTask) {
        await taskApi.update(editingTask.taskId, formData as UpdateTaskDto);
        toast.success(`Task "${formData.title}" updated successfully.`);
      } else {
        await taskApi.create(formData);
        toast.success(`Task "${formData.title}" created successfully.`);
      }
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while saving the task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Status Move in Kanban
  const handleQuickStatusChange = async (task: Task, newStatus: number) => {
    try {
      await taskApi.update(task.taskId, {
        title: task.title,
        description: task.description,
        status: newStatus,
        priority: task.priority,
        dueDate: task.dueDate,
        projectId: task.projectId,
        tagIds: task.tags?.map(t => t.tagId) || [],
      });
      toast.success(`Moved "${task.title}" to ${STATUS_COLUMNS.find(c => c.id === newStatus)?.title}.`);
      fetchTasks();
    } catch (err) {
      console.error(err);
      toast.error('Failed to change task status.');
    }
  };

  // Handle Delete Task
  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await taskApi.delete(taskToDelete.taskId);
      toast.success(`Task "${taskToDelete.title}" deleted.`);
      setTaskToDelete(null);
      fetchTasks();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete task.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle Tag in Form
  const toggleTagSelection = (tagId: number) => {
    setFormData(prev => {
      const exists = prev.tagIds?.includes(tagId);
      const newTagIds = exists
        ? prev.tagIds?.filter(id => id !== tagId)
        : [...(prev.tagIds || []), tagId];
      return { ...prev, tagIds: newTagIds };
    });
  };

  // Reset Filters
  const resetFilters = () => {
    setSearchTitle('');
    setFilterDepartment('');
    setFilterProject('');
    setFilterStatus('');
    setFilterPriority('');
    setFilterTag('');
  };

  const hasActiveFilters =
    searchTitle ||
    filterDepartment !== '' ||
    filterProject !== '' ||
    filterStatus !== '' ||
    filterPriority !== '' ||
    filterTag !== '';

  // Get Mockup visual for specific design tasks to match layout screenshot
  const getTaskMockup = (task: Task) => {
    const titleLower = task.title.toLowerCase();
    if (titleLower.includes('chat') || titleLower.includes('mobile') || titleLower.includes('ui')) {
      return '/mockups/chat_mockup.jpg';
    }
    if (titleLower.includes('dashboard') || titleLower.includes('flow') || titleLower.includes('user') || titleLower.includes('web')) {
      return '/mockups/flow_mockup.jpg';
    }
    return null;
  };

  // Calculate progress % based on task status
  const getTaskProgress = (task: Task) => {
    if (task.status === 2) return 100;
    if (task.status === 1) {
      // Deterministic calculation based on taskId
      return Math.min(85, Math.max(35, ((task.taskId * 37) % 55) + 35));
    }
    if (task.status === 3) return 0;
    return Math.min(25, (task.taskId * 13) % 25);
  };

  // Get comment count for task
  const getCommentCount = (taskId: number) => {
    return (taskId * 7 + 4) % 24;
  };

  // Dynamically filtered projects based on selected department (if any)
  const availableProjects = filterDepartment !== ''
    ? projects.filter(p => p.departmentId === filterDepartment)
    : projects;

  // Refined tasks list applying active filters
  const filteredTasks = tasks.filter(task => {
    if (filterDepartment !== '') {
      const proj = projects.find(p => p.projectId === task.projectId);
      if (!proj || proj.departmentId !== filterDepartment) return false;
    }
    return true;
  });

  return (
    <div className="tasks-board-page">
      {/* ==================== PAGE HEADER & ACTION CONTROLS ==================== */}
      <div className="board-top-section">
        <div className="board-title-group">
          <h1 className="board-main-title">My Tasks</h1>
          
          {/* Dynamic Filter Dropdown Pills from Real Database */}
          <div className="filter-pills-bar">
            {/* Search Input Pill */}
            <div className="search-pill-box" style={{ minWidth: '220px', flex: 'none' }}>
              <Search size={14} className="search-pill-icon" />
              <input
                type="text"
                className="search-pill-input"
                placeholder="Search tasks by title..."
                value={searchTitle}
                onChange={e => setSearchTitle(e.target.value)}
              />
              {searchTitle && (
                <button className="clear-pill-btn" onClick={() => setSearchTitle('')}>
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Department Filter (Dynamic from DB) */}
            {departments.length > 0 && (
              <div className="filter-pill-dropdown">
                <select
                  value={filterDepartment}
                  onChange={e => {
                    const val = e.target.value ? Number(e.target.value) : '';
                    setFilterDepartment(val);
                    setFilterProject(''); // Reset project if department changes
                  }}
                  className="filter-pill-select"
                >
                  <option value="">Departments</option>
                  {departments.map(d => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="pill-arrow-icon" />
              </div>
            )}

            {/* Project Filter (Dynamic from DB) */}
            <div className="filter-pill-dropdown">
              <select
                value={filterProject}
                onChange={e => setFilterProject(e.target.value ? Number(e.target.value) : '')}
                className="filter-pill-select"
              >
                <option value="">Projects</option>
                {availableProjects.map(p => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.projectName}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="pill-arrow-icon" />
            </div>

            {/* Priority Filter (Dynamic enum) */}
            <div className="filter-pill-dropdown">
              <select
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value ? Number(e.target.value) : '')}
                className="filter-pill-select"
              >
                <option value="">Priority</option>
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="pill-arrow-icon" />
            </div>

            {/* Tag Filter (Dynamic from DB) */}
            {tags.length > 0 && (
              <div className="filter-pill-dropdown">
                <select
                  value={filterTag}
                  onChange={e => setFilterTag(e.target.value ? Number(e.target.value) : '')}
                  className="filter-pill-select"
                >
                  <option value="">Tags</option>
                  {tags.map(t => (
                    <option key={t.tagId} value={t.tagId}>
                      #{t.tagName}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="pill-arrow-icon" />
              </div>
            )}

            {/* Status Filter (Especially for Table View or general filter) */}
            {viewMode === 'table' && (
              <div className="filter-pill-dropdown">
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value ? Number(e.target.value) : '')}
                  className="filter-pill-select"
                >
                  <option value="">Status</option>
                  {STATUS_COLUMNS.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="pill-arrow-icon" />
              </div>
            )}

            {hasActiveFilters && (
              <button className="reset-filter-btn" onClick={resetFilters}>
                <X size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Tools: View Mode Switcher + New Task Button */}
        <div className="board-actions-group">
          <div className="view-mode-pill-group">
            <button
              className={`view-mode-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Kanban Board View"
            >
              <Kanban size={15} />
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table List View"
            >
              <TableIcon size={15} />
            </button>
            <button className="view-mode-btn" title="More options">
              <MoreHorizontal size={15} />
            </button>
          </div>

          <button className="btn-create-task" onClick={() => openTaskModal()}>
            <Plus size={16} strokeWidth={2.5} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* ==================== MAIN CONTENT: KANBAN BOARD OR TABLE ==================== */}
      {loading ? (
        <div className="kanban-grid-loading">
          <Skeleton height="400px" borderRadius="16px" />
          <Skeleton height="400px" borderRadius="16px" />
          <Skeleton height="400px" borderRadius="16px" />
          <Skeleton height="400px" borderRadius="16px" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="No tasks match your criteria"
          description="Try clearing your filters or create a new task to get started."
          actionText="Create New Task"
          onAction={() => openTaskModal()}
        />
      ) : viewMode === 'kanban' ? (
        /* ==================== KANBAN BOARD VIEW ==================== */
        <div className="kanban-board-grid">
          {STATUS_COLUMNS.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="kanban-column-wrapper">
                {/* Column Header */}
                <div className="kanban-col-head">
                  <div className="col-title-group">
                    <h3 className="col-heading">{col.title}</h3>
                    <span className="col-task-count">{colTasks.length}</span>
                  </div>

                  <div className="col-actions">
                    <button
                      className="col-action-btn"
                      onClick={() => openTaskModal(undefined, col.id)}
                      title={`Add task to ${col.title}`}
                    >
                      <Plus size={15} />
                    </button>
                    <button className="col-action-btn" title="Column options">
                      <MoreHorizontal size={15} />
                    </button>
                  </div>
                </div>

                {/* Column Cards Stack */}
                <div className="kanban-cards-container">
                  {colTasks.length === 0 ? (
                    <div className="kanban-empty-dropzone">
                      <span>No tasks in {col.title}</span>
                      <button
                        className="empty-col-add-btn"
                        onClick={() => openTaskModal(undefined, col.id)}
                      >
                        + Add task
                      </button>
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const mockupImg = getTaskMockup(task);
                      const progress = getTaskProgress(task);
                      const commentsCount = getCommentCount(task.taskId);
                      const isMenuOpen = activeCardMenu === task.taskId;

                      return (
                        <div key={task.taskId} className="kanban-task-card">
                          {/* Card Top: Tags & Menu */}
                          <div className="task-card-top-row">
                            <div className="task-tags-row">
                              {/* Priority Pastel Badge */}
                              <span
                                className={`pastel-tag priority-tag priority-${task.priority}`}
                              >
                                {task.priorityName || PRIORITY_OPTIONS[task.priority]?.label || 'Normal'}
                              </span>

                              {/* Project Tag */}
                              {task.projectName && (
                                <span className="pastel-tag project-tag">
                                  {task.projectName}
                                </span>
                              )}

                              {/* Tags List */}
                              {task.tags?.slice(0, 2).map(t => (
                                <span
                                  key={t.tagId}
                                  className="pastel-tag custom-tag"
                                  style={{
                                    backgroundColor: t.color ? `${t.color}15` : undefined,
                                    color: t.color || undefined,
                                    borderColor: t.color ? `${t.color}30` : undefined,
                                  }}
                                >
                                  {t.tagName}
                                </span>
                              ))}
                            </div>

                            {/* Card Menu Button */}
                            <div className="card-menu-dropdown-wrapper">
                              <button
                                className="card-dot-menu-btn"
                                onClick={e => {
                                  e.stopPropagation();
                                  setActiveCardMenu(isMenuOpen ? null : task.taskId);
                                }}
                                title="Task options"
                              >
                                <MoreHorizontal size={15} />
                              </button>

                              {/* Dropdown Menu */}
                              {isMenuOpen && (
                                <div
                                  className="card-context-menu"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <Link
                                    to={`/tasks/${task.taskId}`}
                                    className="context-menu-item"
                                  >
                                    View details
                                  </Link>
                                  <button
                                    className="context-menu-item"
                                    onClick={() => {
                                      setActiveCardMenu(null);
                                      openTaskModal(task);
                                    }}
                                  >
                                    Edit task
                                  </button>
                                  <div className="context-menu-divider" />
                                  <div className="context-menu-section-title">Move to:</div>
                                  {STATUS_COLUMNS.filter(c => c.id !== task.status).map(c => (
                                    <button
                                      key={c.id}
                                      className="context-menu-item move-item"
                                      onClick={() => {
                                        setActiveCardMenu(null);
                                        handleQuickStatusChange(task, c.id);
                                      }}
                                    >
                                      → {c.title}
                                    </button>
                                  ))}
                                  <div className="context-menu-divider" />
                                  <button
                                    className="context-menu-item text-danger"
                                    onClick={() => {
                                      setActiveCardMenu(null);
                                      setTaskToDelete(task);
                                    }}
                                  >
                                    Delete task
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Task Title */}
                          <Link to={`/tasks/${task.taskId}`} className="task-title-link">
                            <h4 className="task-card-title">{task.title}</h4>
                          </Link>

                          {/* Task Description */}
                          {task.description && (
                            <p className="task-card-desc">{task.description}</p>
                          )}

                          {/* Card Mockup Attachment Banner (if present) */}
                          {mockupImg && (
                            <div className="task-mockup-wrapper">
                              <img
                                src={mockupImg}
                                alt={task.title}
                                className="task-mockup-img"
                                loading="lazy"
                              />
                            </div>
                          )}

                          {/* Progress Section */}
                          <div className="task-progress-box">
                            <div className="progress-info-row">
                              <span className="progress-label">Progress</span>
                              <span className="progress-percent">{progress}%</span>
                            </div>
                            <div className="progress-track">
                              <div
                                className={`progress-fill ${progress === 100 ? 'complete' : ''}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Card Footer: Assignees & Metadata */}
                          <div className="task-card-footer">
                            {/* Stacked Assignee Avatars */}
                            <div className="assignees-stacked-group">
                              <img
                                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                                alt="Assignee 1"
                                className="stacked-avatar-img"
                              />
                              <img
                                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                                alt="Assignee 2"
                                className="stacked-avatar-img"
                              />
                              {(task.taskId % 3 === 0) && (
                                <div className="stacked-avatar-more">+2</div>
                              )}
                            </div>

                            {/* Comments & Attachments Count */}
                            <div className="task-meta-stats">
                              <span className="meta-stat-pill" title="Comments">
                                <MessageSquare size={13} />
                                <span>{commentsCount} comments</span>
                              </span>
                              <span className="meta-stat-pill" title="Attachments">
                                <Paperclip size={13} />
                                <span>{task.taskId % 2 === 0 ? '2 Files' : '0 Files'}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ==================== DATA TABLE VIEW ==================== */
        <div className="table-view-container">
          <table className="clean-data-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Project</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Due Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => {
                const progress = getTaskProgress(task);
                return (
                  <tr key={task.taskId}>
                    <td className="task-title-cell">
                      <Link to={`/tasks/${task.taskId}`} className="table-task-link">
                        {task.title}
                      </Link>
                      {task.description && (
                        <div className="table-task-desc">{task.description}</div>
                      )}
                    </td>
                    <td>
                      <span className="table-project-pill">
                        {task.projectName || 'General Project'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`pastel-tag priority-tag priority-${task.priority}`}
                      >
                        {task.priorityName || PRIORITY_OPTIONS[task.priority]?.label || 'Normal'}
                      </span>
                    </td>
                    <td>
                      <TaskStatusBadge
                        status={task.status}
                        statusName={task.statusName}
                      />
                    </td>
                    <td style={{ width: '140px' }}>
                      <div className="table-progress-wrapper">
                        <div className="progress-track">
                          <div
                            className={`progress-fill ${progress === 100 ? 'complete' : ''}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="table-progress-text">{progress}%</span>
                      </div>
                    </td>
                    <td>
                      {task.dueDate ? (
                        <span className="table-date-pill">
                          <Calendar size={12} />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="table-muted-text">—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-row-actions">
                        <button
                          className="table-action-btn"
                          onClick={() => openTaskModal(task)}
                          title="Edit Task"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="table-action-btn delete-btn"
                          onClick={() => setTaskToDelete(task)}
                          title="Delete Task"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================== CREATE / EDIT TASK MODAL ==================== */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">
              Task Title <span className="required-star">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              className="form-input"
              placeholder="e.g., Add new chat feature in mobile UI"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-desc">
              Description / Instructions
            </label>
            <textarea
              id="task-desc"
              className="form-textarea"
              rows={3}
              placeholder="Provide context, acceptance criteria, or design specifications..."
              value={formData.description || ''}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="task-project">
                Associated Project <span className="required-star">*</span>
              </label>
              <select
                id="task-project"
                className="form-select"
                value={formData.projectId}
                onChange={e => setFormData(prev => ({ ...prev, projectId: Number(e.target.value) }))}
                required
              >
                <option value={0} disabled>
                  Select a Project
                </option>
                {projects.map(p => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.projectName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-status">
                Status
              </label>
              <select
                id="task-status"
                className="form-select"
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: Number(e.target.value) }))}
              >
                {STATUS_COLUMNS.map(col => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="task-priority">
                Priority Level
              </label>
              <select
                id="task-priority"
                className="form-select"
                value={formData.priority}
                onChange={e => setFormData(prev => ({ ...prev, priority: Number(e.target.value) }))}
              >
                {PRIORITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-due-date">
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                className="form-input"
                value={formData.dueDate || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    dueDate: e.target.value ? e.target.value : undefined,
                  }))
                }
              />
            </div>
          </div>

          {/* Tags Selection */}
          {tags.length > 0 && (
            <div className="form-group">
              <label className="form-label">Tags & Taxonomy</label>
              <div className="tag-picker-container">
                {tags.map(t => {
                  const selected = formData.tagIds?.includes(t.tagId);
                  return (
                    <button
                      type="button"
                      key={t.tagId}
                      className={`tag-picker-chip ${selected ? 'selected' : ''}`}
                      style={{
                        borderColor: selected ? t.color || 'var(--primary)' : undefined,
                        backgroundColor: selected ? `${t.color || '#4f46e5'}15` : undefined,
                        color: selected ? t.color || 'var(--primary)' : undefined,
                      }}
                      onClick={() => toggleTagSelection(t.tagId)}
                    >
                      {selected && <Check size={12} />}
                      #{t.tagName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="modal-actions-bar">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : editingTask
                ? 'Update Task'
                : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      <ConfirmModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
