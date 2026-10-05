import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FolderKanban,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Plus,
  Edit2,
  ChevronRight,
  Home,
  CheckSquare,
  Tag as TagIcon,
} from 'lucide-react';
import { projectApi, taskApi, tagApi, departmentApi } from '../services/api';
import type { Project, CreateTaskDto, UpdateProjectDto, Tag, Department } from '../types';
import { Badge, TaskStatusBadge, PriorityBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';
import './DetailPages.css';

const PROJECT_STATUS_OPTIONS = [
  { value: 0, label: 'Planning', color: '#64748b' },
  { value: 1, label: 'In Progress', color: '#3b82f6' },
  { value: 2, label: 'Completed', color: '#10b981' },
  { value: 3, label: 'On Hold', color: '#f59e0b' },
  { value: 4, label: 'Cancelled', color: '#ef4444' },
];

const TASK_STATUS_OPTIONS = [
  { value: 0, label: 'To Do' },
  { value: 1, label: 'In Progress' },
  { value: 2, label: 'Completed' },
  { value: 3, label: 'Cancelled' },
];

const PRIORITY_OPTIONS = [
  { value: 0, label: 'Low' },
  { value: 1, label: 'Medium' },
  { value: 2, label: 'High' },
  { value: 3, label: 'Critical' },
];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEditProjModal, setShowEditProjModal] = useState(false);
  const [projForm, setProjForm] = useState<UpdateProjectDto>({
    projectName: '',
    description: '',
    startDate: '',
    endDate: undefined,
    status: 0,
    departmentId: 0,
  });

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState<CreateTaskDto>({
    title: '',
    description: '',
    status: 0,
    priority: 1,
    dueDate: undefined,
    projectId: 0,
    tagIds: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjectData = useCallback(async () => {
    if (!id) return;
    try {
      const [projData, deptData, tagData] = await Promise.all([
        projectApi.getById(Number(id)),
        departmentApi.getAll(),
        tagApi.getAll(),
      ]);
      setProject(projData);
      setDepartments(deptData);
      setTags(tagData);

      if (projData) {
        setProjForm({
          projectName: projData.projectName,
          description: projData.description || '',
          startDate: projData.startDate ? projData.startDate.split('T')[0] : '',
          endDate: projData.endDate ? projData.endDate.split('T')[0] : undefined,
          status: projData.status,
          departmentId: projData.departmentId,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load project details.');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const handleEditProjSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projForm.projectName.trim() || !project) return;
    if (projForm.startDate && projForm.endDate && new Date(projForm.startDate) > new Date(projForm.endDate)) {
      toast.warning('Start date cannot be after end date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await projectApi.update(project.projectId, projForm);
      toast.success(`Project "${projForm.projectName}" updated.`);
      setShowEditProjModal(false);
      fetchProjectData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !project) return;

    setIsSubmitting(true);
    try {
      await taskApi.create({ ...taskForm, projectId: project.projectId });
      toast.success(`Task "${taskForm.title}" added to project.`);
      setShowAddTaskModal(false);
      fetchProjectData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTagSelection = (tagId: number) => {
    setTaskForm(prev => {
      const exists = prev.tagIds?.includes(tagId);
      const newTagIds = exists
        ? prev.tagIds?.filter(tId => tId !== tagId)
        : [...(prev.tagIds || []), tagId];
      return { ...prev, tagIds: newTagIds };
    });
  };

  if (loading) {
    return (
      <div className="detail-page-container">
        <Skeleton height="40px" width="220px" borderRadius="var(--radius-md)" />
        <Skeleton height="200px" borderRadius="var(--radius-xl)" />
        <div style={{ marginTop: '24px' }}>
          <Skeleton height="300px" borderRadius="var(--radius-xl)" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="detail-page-container">
        <EmptyState
          title="Project Not Found"
          description="The project you requested does not exist or has been deleted."
          actionText="Back to Projects"
          onAction={() => window.history.back()}
        />
      </div>
    );
  }

  const tasks = project.tasks || [];
  const completedCount = tasks.filter(t => t.status === 2).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="detail-page-container animate-fade-in">
      {/* Breadcrumbs */}
      <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/" className="breadcrumb-item">
          <Home size={14} />
          <span>Home</span>
        </Link>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <Link to="/projects" className="breadcrumb-item">
          <span>Projects</span>
        </Link>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <span className="breadcrumb-item breadcrumb-current">{project.projectName}</span>
      </nav>

      {/* Hero Card */}
      <div className="glass-card detail-hero-card">
        <div className="detail-hero-header">
          <div className="detail-hero-icon proj-hero-icon">
            <FolderKanban size={32} />
          </div>
          <div className="detail-hero-meta">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="detail-title">{project.projectName}</h1>
              <Badge
                label={project.statusName || (project.status === 2 ? 'Completed' : 'In Progress')}
                variant={project.status === 2 ? 'success' : 'info'}
              />
            </div>
            <p className="detail-desc">
              {project.description || 'No detailed description provided.'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="hero-progress-box">
          <div className="hero-progress-labels">
            <span>Initiative Completion</span>
            <span>
              {completedCount}/{tasks.length} Tasks ({progressPct}%)
            </span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progressPct}%`, background: 'var(--primary)' }}
            />
          </div>
        </div>

        <div className="detail-hero-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link
              to={`/departments/${project.departmentId}`}
              className="detail-stat-pill clickable-pill"
              title="View Owning Department"
            >
              <Building2 size={14} />
              <span>{project.departmentName}</span>
            </Link>
            <div className="detail-stat-pill">
              <Calendar size={14} />
              <span>
                {new Date(project.startDate).toLocaleDateString()}
                {project.endDate ? ` → ${new Date(project.endDate).toLocaleDateString()}` : ' (Ongoing)'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowEditProjModal(true)}>
              <Edit2 size={14} />
              <span>Edit Project</span>
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setTaskForm({
                  title: '',
                  description: '',
                  status: 0,
                  priority: 1,
                  dueDate: undefined,
                  projectId: project.projectId,
                  tagIds: [],
                });
                setShowAddTaskModal(true);
              }}
            >
              <Plus size={14} />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Associated Tasks Section */}
      <div className="detail-section">
        <div className="section-header-row">
          <div>
            <h2 className="detail-section-title">Project Deliverables & Tasks</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Work items scoped specifically under {project.projectName}
            </p>
          </div>
          <span className="badge-pill">{tasks.length} Tasks</span>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            title="No tasks in this project"
            description="Create tasks to track deliverables, milestones, and assign priorities."
            actionText="Create First Task"
            onAction={() => setShowAddTaskModal(true)}
          />
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Tags</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right' }}>View</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.taskId}>
                    <td style={{ fontWeight: 600 }}>
                      <Link to={`/tasks/${task.taskId}`} className="table-task-link">
                        <CheckSquare size={16} className="task-row-icon" />
                        <span>{task.title}</span>
                      </Link>
                    </td>
                    <td>
                      <PriorityBadge
                        priority={task.priority}
                        priorityName={task.priorityName}
                      />
                    </td>
                    <td>
                      <TaskStatusBadge
                        status={task.status}
                        statusName={task.statusName}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {task.tags && task.tags.length > 0 ? (
                          task.tags.map(t => (
                            <Badge
                              key={t.tagId}
                              label={t.tagName}
                              color={t.color}
                              size="sm"
                            />
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {task.dueDate ? (
                        <span className="table-date-cell">
                          <Clock size={12} />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/tasks/${task.taskId}`} className="btn-icon-sm btn-ghost">
                        <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditProjModal}
        onClose={() => setShowEditProjModal(false)}
        title="Edit Project"
        subtitle={`Updating ${project.projectName}`}
        maxWidth="md"
      >
        <form onSubmit={handleEditProjSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              className="form-input"
              value={projForm.projectName}
              onChange={e => setProjForm({ ...projForm, projectName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={projForm.description || ''}
              onChange={e => setProjForm({ ...projForm, description: e.target.value })}
            />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className="form-select"
                value={projForm.departmentId}
                onChange={e => setProjForm({ ...projForm, departmentId: Number(e.target.value) })}
                required
              >
                {departments.map(d => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.departmentName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={projForm.status}
                onChange={e => setProjForm({ ...projForm, status: Number(e.target.value) })}
              >
                {PROJECT_STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                className="form-input"
                value={projForm.startDate}
                onChange={e => setProjForm({ ...projForm, startDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Target End Date</label>
              <input
                type="date"
                className="form-input"
                value={projForm.endDate || ''}
                onChange={e =>
                  setProjForm({ ...projForm, endDate: e.target.value ? e.target.value : undefined })
                }
              />
            </div>
          </div>
          <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowEditProjModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Task Modal */}
      <Modal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        title="Create Task"
        subtitle={`Target Project: ${project.projectName}`}
        maxWidth="md"
      >
        <form onSubmit={handleAddTaskSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Implement responsive layout"
              value={taskForm.title}
              onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="Acceptance criteria and notes..."
              value={taskForm.description || ''}
              onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
            />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={taskForm.status}
                onChange={e => setTaskForm({ ...taskForm, status: Number(e.target.value) })}
              >
                {TASK_STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={taskForm.priority}
                onChange={e => setTaskForm({ ...taskForm, priority: Number(e.target.value) })}
              >
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>
                    {p.label} Priority
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              className="form-input"
              value={taskForm.dueDate || ''}
              onChange={e =>
                setTaskForm({ ...taskForm, dueDate: e.target.value ? e.target.value : undefined })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Attach Tags</label>
            <div className="tag-selector-chips">
              {tags.map(t => {
                const isSelected = taskForm.tagIds?.includes(t.tagId);
                return (
                  <button
                    key={t.tagId}
                    type="button"
                    className={`tag-chip ${isSelected ? 'tag-chip-active' : ''}`}
                    onClick={() => toggleTagSelection(t.tagId)}
                    style={{
                      borderColor: isSelected ? t.color || 'var(--primary)' : 'var(--border-base)',
                      backgroundColor: isSelected ? `${t.color || '#6366f1'}22` : 'var(--bg-secondary)',
                      color: isSelected ? t.color || 'var(--primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <TagIcon size={12} />
                    <span>{t.tagName}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAddTaskModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
