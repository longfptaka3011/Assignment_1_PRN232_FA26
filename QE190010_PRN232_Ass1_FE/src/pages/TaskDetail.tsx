import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Folder,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  ChevronRight,
  Home,
  Tag as TagIcon,
} from 'lucide-react';
import { taskApi, projectApi, tagApi } from '../services/api';
import type { Task, UpdateTaskDto, Project, Tag } from '../types';
import { Badge, TaskStatusBadge, PriorityBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';
import './DetailPages.css';

const STATUS_OPTIONS = [
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

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<UpdateTaskDto>({
    title: '',
    description: '',
    status: 0,
    priority: 1,
    dueDate: undefined,
    projectId: 0,
    tagIds: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTaskData = useCallback(async () => {
    if (!id) return;
    try {
      const [taskData, projData, tagData] = await Promise.all([
        taskApi.getById(Number(id)),
        projectApi.getAll(),
        tagApi.getAll(),
      ]);
      setTask(taskData);
      setProjects(projData);
      setTags(tagData);

      if (taskData) {
        setEditForm({
          title: taskData.title,
          description: taskData.description || '',
          status: taskData.status,
          priority: taskData.priority,
          dueDate: taskData.dueDate ? taskData.dueDate.split('T')[0] : undefined,
          projectId: taskData.projectId,
          tagIds: taskData.tags?.map(t => t.tagId) || [],
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load task details.');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchTaskData();
  }, [fetchTaskData]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim() || !task) return;

    setIsSubmitting(true);
    try {
      await taskApi.update(task.taskId, editForm);
      toast.success(`Task "${editForm.title}" updated.`);
      setShowEditModal(false);
      fetchTaskData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!task) return;
    setIsDeleting(true);
    try {
      await taskApi.delete(task.taskId);
      toast.success(`Task "${task.title}" deleted.`);
      setShowDeleteModal(false);
      navigate('/tasks');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete task.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleTagSelection = (tagId: number) => {
    setEditForm(prev => {
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
        <Skeleton height="40px" width="200px" borderRadius="var(--radius-md)" />
        <Skeleton height="260px" borderRadius="var(--radius-xl)" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="detail-page-container">
        <EmptyState
          title="Task Not Found"
          description="The task you requested could not be located."
          actionText="Back to Tasks"
          onAction={() => navigate('/tasks')}
        />
      </div>
    );
  }

  return (
    <div className="detail-page-container animate-fade-in">
      {/* Breadcrumbs */}
      <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/" className="breadcrumb-item">
          <Home size={14} />
          <span>Home</span>
        </Link>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <Link to="/tasks" className="breadcrumb-item">
          <span>Tasks</span>
        </Link>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <span className="breadcrumb-item breadcrumb-current">{task.title}</span>
      </nav>

      <div className="glass-card task-detail-card">
        <div className="task-detail-top">
          <div className="task-id-badge">TASK #{task.taskId}</div>
          <div className="task-detail-badges">
            <PriorityBadge priority={task.priority} priorityName={task.priorityName} />
            <TaskStatusBadge status={task.status} statusName={task.statusName} />
          </div>
        </div>

        <h1 className="task-detail-title">{task.title}</h1>

        <div className="task-detail-meta-grid">
          <div className="meta-box">
            <span className="meta-box-label">Associated Project</span>
            <Link to={`/projects/${task.projectId}`} className="meta-box-link" title="Open Project Detail">
              <Folder size={14} />
              <span>{task.projectName || 'General Project'}</span>
            </Link>
          </div>

          <div className="meta-box">
            <span className="meta-box-label">Due Date</span>
            <div className="meta-box-value">
              <Calendar size={14} />
              <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline set'}</span>
            </div>
          </div>

          <div className="meta-box">
            <span className="meta-box-label">Created Date</span>
            <div className="meta-box-value">
              <Clock size={14} />
              <span>{new Date(task.createdDate).toLocaleString()}</span>
            </div>
          </div>

          {task.modifiedDate && (
            <div className="meta-box">
              <span className="meta-box-label">Last Modified</span>
              <div className="meta-box-value">
                <Clock size={14} />
                <span>{new Date(task.modifiedDate).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        <div className="task-detail-section">
          <h3 className="section-subheading">Description & Acceptance Criteria</h3>
          <div className="task-description-box">
            {task.description ? (
              <p>{task.description}</p>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>No additional description provided.</span>
            )}
          </div>
        </div>

        <div className="task-detail-section">
          <h3 className="section-subheading">Attached Tags</h3>
          <div className="tags-flex-wrap">
            {task.tags && task.tags.length > 0 ? (
              task.tags.map(t => (
                <Badge
                  key={t.tagId}
                  label={`#${t.tagName}`}
                  color={t.color}
                  size="md"
                />
              ))
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No tags attached to this task.</span>
            )}
          </div>
        </div>

        <div className="task-detail-footer">
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteModal(true)}>
              <Trash2 size={14} />
              <span>Delete Task</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowEditModal(true)}>
              <Edit2 size={14} />
              <span>Edit Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Task"
        subtitle={`Editing Task #${task.taskId}`}
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              className="form-input"
              value={editForm.title}
              onChange={e => setEditForm({ ...editForm, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={editForm.description || ''}
              onChange={e => setEditForm({ ...editForm, description: e.target.value })}
            />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Project *</label>
              <select
                className="form-select"
                value={editForm.projectId}
                onChange={e => setEditForm({ ...editForm, projectId: Number(e.target.value) })}
                required
              >
                {projects.map(p => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.projectName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                value={editForm.dueDate || ''}
                onChange={e =>
                  setEditForm({ ...editForm, dueDate: e.target.value ? e.target.value : undefined })
                }
              />
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={editForm.status}
                onChange={e => setEditForm({ ...editForm, status: Number(e.target.value) })}
              >
                {STATUS_OPTIONS.map(s => (
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
                value={editForm.priority}
                onChange={e => setEditForm({ ...editForm, priority: Number(e.target.value) })}
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
            <label className="form-label">Attach Tags</label>
            <div className="tag-selector-chips">
              {tags.map(t => {
                const isSelected = editForm.tagIds?.includes(t.tagId);
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
              onClick={() => setShowEditModal(false)}
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

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to soft-delete "${task.title}"? This task will become inactive.`}
        confirmText="Delete Task"
        isLoading={isDeleting}
      />
    </div>
  );
}
