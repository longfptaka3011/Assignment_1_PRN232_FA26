import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  CheckSquare,
  Folder,
  Calendar,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { taskApi, projectApi, tagApi } from '../services/api';
import type { Task, Project, Tag } from '../types';
import { Badge, TaskStatusBadge, PriorityBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import './SearchPage.css';

const STATUS_OPTIONS = [
  { value: 0, label: 'To Do' },
  { value: 1, label: 'In Progress' },
  { value: 2, label: 'Done' },
  { value: 3, label: 'Cancelled' },
];

const PRIORITY_OPTIONS = [
  { value: 0, label: 'Low' },
  { value: 1, label: 'Medium' },
  { value: 2, label: 'High' },
  { value: 3, label: 'Critical' },
];

export default function SearchPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<number | ''>('');
  const [priority, setPriority] = useState<number | ''>('');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [tagId, setTagId] = useState<number | ''>('');

  useEffect(() => {
    Promise.all([projectApi.getAll(), tagApi.getAll()])
      .then(([projs, tgs]) => {
        setProjects(projs);
        setTags(tgs);
      })
      .catch(err => console.error(err));
  }, []);

  const executeSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        title?: string;
        status?: number | '';
        priority?: number | '';
        projectId?: number | '';
        tagId?: number | '';
      } = {};

      if (title.trim()) params.title = title.trim();
      if (status !== '') params.status = status;
      if (priority !== '') params.priority = priority;
      if (projectId !== '') params.projectId = projectId;
      if (tagId !== '') params.tagId = tagId;

      const data = await taskApi.getAll(Object.keys(params).length > 0 ? params : undefined);
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [title, status, priority, projectId, tagId]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  const resetAllFilters = () => {
    setTitle('');
    setStatus('');
    setPriority('');
    setProjectId('');
    setTagId('');
  };

  const hasFilters = title || status !== '' || priority !== '' || projectId !== '' || tagId !== '';

  return (
    <div className="search-page-container animate-fade-in">
      {/* Header */}
      <div className="search-hero">
        <div className="search-hero-badge">
          <Sparkles size={14} />
          <span>Real-time Multi-Criteria Search</span>
        </div>
        <h1 className="search-hero-title">Search & Filter Hub</h1>
        <p className="search-hero-subtitle">
          Instantly discover tasks by combining keywords, status, urgency, project boundaries, and custom tags.
        </p>
      </div>

      {/* Filter Panel */}
      <div className="glass-card search-filter-card">
        <div className="search-main-bar">
          <Search size={18} className="search-bar-icon" />
          <input
            type="text"
            className="search-bar-input"
            placeholder="Search tasks by title keywords..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          {title && (
            <button className="search-clear-btn" onClick={() => setTitle('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="search-criteria-row">
          <div className="criteria-item">
            <label className="criteria-label">Project</label>
            <select
              className="criteria-select"
              value={projectId}
              onChange={e => setProjectId(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.projectId} value={p.projectId}>
                  {p.projectName}
                </option>
              ))}
            </select>
          </div>

          <div className="criteria-item">
            <label className="criteria-label">Status</label>
            <select
              className="criteria-select"
              value={status}
              onChange={e => setStatus(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="criteria-item">
            <label className="criteria-label">Priority</label>
            <select
              className="criteria-select"
              value={priority}
              onChange={e => setPriority(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">All Priorities</option>
              {PRIORITY_OPTIONS.map(p => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="criteria-item">
            <label className="criteria-label">Tag</label>
            <select
              className="criteria-select"
              value={tagId}
              onChange={e => setTagId(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">All Tags</option>
              {tags.map(t => (
                <option key={t.tagId} value={t.tagId}>
                  #{t.tagName}
                </option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button className="btn btn-ghost btn-sm reset-criteria-btn" onClick={resetAllFilters}>
              <X size={14} />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="search-results-section">
        <div className="results-header">
          <h3 className="results-count-title">
            Search Results <span className="count-number">({tasks.length})</span>
          </h3>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Skeleton height="70px" borderRadius="var(--radius-lg)" />
            <Skeleton height="70px" borderRadius="var(--radius-lg)" />
            <Skeleton height="70px" borderRadius="var(--radius-lg)" />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No matching tasks found"
            description="Try relaxing your search terms or selecting different filter options."
            actionText="Reset Search"
            onAction={resetAllFilters}
          />
        ) : (
          <div className="search-results-list">
            {tasks.map(task => (
              <div key={task.taskId} className="glass-card search-result-item">
                <div className="result-item-left">
                  <div className="result-item-top">
                    <Link to={`/tasks/${task.taskId}`} className="result-task-title">
                      <CheckSquare size={16} className="task-bullet-icon" />
                      <span>{task.title}</span>
                    </Link>
                    <div className="result-badges">
                      <PriorityBadge priority={task.priority} priorityName={task.priorityName} />
                      <TaskStatusBadge status={task.status} statusName={task.statusName} />
                    </div>
                  </div>

                  {task.description && (
                    <p className="result-task-desc">{task.description}</p>
                  )}

                  <div className="result-item-meta">
                    <span className="meta-project-tag">
                      <Folder size={12} />
                      {task.projectName || 'General'}
                    </span>
                    {task.dueDate && (
                      <span className="meta-date-tag">
                        <Calendar size={12} />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {task.tags && task.tags.length > 0 && (
                      <div className="meta-tags-row">
                        {task.tags.map(t => (
                          <Badge
                            key={t.tagId}
                            label={`#${t.tagName}`}
                            color={t.color}
                            size="sm"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="result-item-right">
                  <Link to={`/tasks/${task.taskId}`} className="btn btn-secondary btn-sm">
                    <span>View Detail</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
