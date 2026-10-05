import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Building2,
  Calendar,
  Edit2,
  Trash2,
  X,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
} from 'lucide-react';
import { projectApi, departmentApi } from '../services/api';
import type { Project, CreateProjectDto, UpdateProjectDto, Department } from '../types';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import './ProjectList.css';

const PROJECT_STATUS_OPTIONS = [
  { value: 0, label: 'Planning', color: '#64748b', bg: '#f1f5f9' },
  { value: 1, label: 'In Progress', color: '#3b82f6', bg: '#eff6ff' },
  { value: 2, label: 'Completed', color: '#10b981', bg: '#ecfdf5' },
  { value: 3, label: 'On Hold', color: '#f59e0b', bg: '#fffbeb' },
  { value: 4, label: 'Cancelled', color: '#ef4444', bg: '#fef2f2' },
];

export default function ProjectList() {
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'table' | 'grid'
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Filters
  const [searchName, setSearchName] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<number | ''>('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm Modal
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateProjectDto>({
    projectName: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: undefined,
    status: 0,
    departmentId: 0,
  });

  const fetchProjects = useCallback(async () => {
    try {
      const params: { name?: string; status?: number | ''; departmentId?: number | '' } = {};
      if (searchName.trim()) params.name = searchName.trim();
      if (filterStatus !== '') params.status = filterStatus;
      if (filterDepartment !== '') params.departmentId = filterDepartment;

      const data = await projectApi.getAll(Object.keys(params).length > 0 ? params : undefined);
      setProjects(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, [searchName, filterStatus, filterDepartment, toast]);

  useEffect(() => {
    departmentApi
      .getAll()
      .then(data => setDepartments(data))
      .catch(() => toast.error('Failed to load departments.'));
  }, [toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const openProjectModal = (proj?: Project) => {
    if (proj) {
      setEditingProject(proj);
      setFormData({
        projectName: proj.projectName,
        description: proj.description || '',
        startDate: proj.startDate ? proj.startDate.split('T')[0] : '',
        endDate: proj.endDate ? proj.endDate.split('T')[0] : undefined,
        status: proj.status,
        departmentId: proj.departmentId,
      });
    } else {
      setEditingProject(null);
      setFormData({
        projectName: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: undefined,
        status: 0,
        departmentId: departments[0]?.departmentId || 0,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectName.trim()) {
      toast.warning('Project name is required.');
      return;
    }
    if (!formData.departmentId) {
      toast.warning('Please select an owning department.');
      return;
    }
    if (
      formData.startDate &&
      formData.endDate &&
      new Date(formData.startDate) > new Date(formData.endDate)
    ) {
      toast.warning('Start date cannot be after end date.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProject) {
        await projectApi.update(editingProject.projectId, formData as UpdateProjectDto);
        toast.success(`Project "${formData.projectName}" updated.`);
      } else {
        await projectApi.create(formData);
        toast.success(`Project "${formData.projectName}" created.`);
      }
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await projectApi.delete(projectToDelete.projectId);
      toast.success(`Project "${projectToDelete.projectName}" deleted.`);
      setProjectToDelete(null);
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete project. Please check if tasks exist under this project.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTimeline = (start?: string, end?: string) => {
    if (!start) return '—';
    const s = new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    if (!end) return `${s} → Ongoing`;
    const e = new Date(end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${s} → ${e}`;
  };

  const hasActiveFilters = searchName || filterDepartment !== '' || filterStatus !== '';

  return (
    <div className="projects-page-container">
      {/* ==================== TOP BAR ==================== */}
      <div className="page-header-bar">
        <div>
          <h1 className="page-main-title">Projects</h1>
          <p className="page-sub-title">
            Oversee strategic initiatives, deliverables, timelines, and departmental ownership.
          </p>
        </div>

        <div className="page-actions-row">
          {/* View Mode Toggle */}
          <div className="view-mode-pill-group">
            <button
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <TableIcon size={15} />
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid Cards View"
            >
              <LayoutGrid size={15} />
            </button>
          </div>

          <button className="btn-primary-action" onClick={() => openProjectModal()}>
            <Plus size={16} strokeWidth={2.5} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* ==================== FILTER TOOLBAR ==================== */}
      <div className="filter-toolbar-card">
        <div className="search-pill-box">
          <Search size={15} className="search-pill-icon" />
          <input
            type="text"
            className="search-pill-input"
            placeholder="Search projects by name..."
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
          />
          {searchName && (
            <button className="clear-pill-btn" onClick={() => setSearchName('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-pills-wrap">
          {/* Department Filter */}
          <div className="pill-dropdown-box">
            <select
              className="pill-select-input"
              value={filterDepartment}
              onChange={e => setFilterDepartment(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.departmentName}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="pill-dropdown-arrow" />
          </div>

          {/* Status Filter */}
          <div className="pill-dropdown-box">
            <select
              className="pill-select-input"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">All Statuses</option>
              {PROJECT_STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="pill-dropdown-arrow" />
          </div>

          {hasActiveFilters && (
            <button
              className="reset-filter-pill-btn"
              onClick={() => {
                setSearchName('');
                setFilterDepartment('');
                setFilterStatus('');
              }}
            >
              <X size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================== CONTENT SECTION ==================== */}
      {loading ? (
        <div className="projects-grid-layout">
          <Skeleton height="220px" borderRadius="14px" />
          <Skeleton height="220px" borderRadius="14px" />
          <Skeleton height="220px" borderRadius="14px" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Create your first strategic initiative or adjust your filters."
          actionText="Create New Project"
          onAction={() => openProjectModal()}
        />
      ) : viewMode === 'table' ? (
        /* ==================== MODERN DATA TABLE ==================== */
        <div className="clean-table-container">
          <table className="clean-saas-table">
            <thead>
              <tr>
                <th style={{ width: '32%' }}>Project Name</th>
                <th style={{ width: '18%' }}>Department</th>
                <th style={{ width: '15%' }}>Status</th>
                <th style={{ width: '20%' }}>Timeline</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(proj => {
                return (
                  <tr key={proj.projectId}>
                    <td>
                      <div className="table-project-name-cell">
                        <Link to={`/projects/${proj.projectId}`} className="table-project-title-link">
                          {proj.projectName}
                        </Link>
                        {proj.description && (
                          <p className="table-project-desc">{proj.description}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="table-dept-pill">
                        <Building2 size={13} className="cell-icon" />
                        <span>{proj.departmentName || 'Unassigned'}</span>
                      </span>
                    </td>
                    <td>
                      <span className={`pastel-tag status-tag status-${proj.status}`}>
                        {proj.statusName || PROJECT_STATUS_OPTIONS[proj.status]?.label || 'Active'}
                      </span>
                    </td>
                    <td>
                      <span className="table-date-cell">
                        <Calendar size={13} className="cell-icon" />
                        <span>{formatTimeline(proj.startDate, proj.endDate)}</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions-cell">
                        <button
                          className="table-icon-btn"
                          onClick={() => openProjectModal(proj)}
                          title="Edit Project"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="table-icon-btn delete-btn"
                          onClick={() => setProjectToDelete(proj)}
                          title="Delete Project"
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
      ) : (
        /* ==================== MODERN CARDS GRID ==================== */
        <div className="projects-grid-layout">
          {projects.map(proj => {
            const taskCount = proj.tasks ? proj.tasks.length : 0;
            const completedCount = proj.tasks
              ? proj.tasks.filter(t => t.status === 2).length
              : 0;
            const percent = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

            return (
              <div key={proj.projectId} className="project-saas-card">
                <div className="card-top-header">
                  <div className="card-dept-tag">
                    <Building2 size={13} />
                    <span>{proj.departmentName}</span>
                  </div>
                  <span className={`pastel-tag status-tag status-${proj.status}`}>
                    {proj.statusName}
                  </span>
                </div>

                <Link to={`/projects/${proj.projectId}`} className="card-title-link">
                  <h3 className="card-main-title">{proj.projectName}</h3>
                </Link>

                {proj.description && (
                  <p className="card-desc-text">{proj.description}</p>
                )}

                <div className="card-timeline-row">
                  <Calendar size={13} />
                  <span>{formatTimeline(proj.startDate, proj.endDate)}</span>
                </div>

                <div className="card-progress-section">
                  <div className="progress-info-line">
                    <span>Deliverables ({completedCount}/{taskCount})</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="card-progress-track">
                    <div
                      className={`card-progress-fill ${percent === 100 ? 'done' : ''}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="card-bottom-actions">
                  <Link to={`/projects/${proj.projectId}`} className="card-view-link">
                    View Details →
                  </Link>
                  <div className="card-icon-actions">
                    <button
                      className="table-icon-btn"
                      onClick={() => openProjectModal(proj)}
                      title="Edit Project"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="table-icon-btn delete-btn"
                      onClick={() => setProjectToDelete(proj)}
                      title="Delete Project"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== PROJECT CREATE / EDIT MODAL ==================== */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProject ? 'Edit Project' : 'Create New Project'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label className="form-label" htmlFor="proj-name">
              Project Name <span className="required-star">*</span>
            </label>
            <input
              id="proj-name"
              type="text"
              className="form-input"
              placeholder="e.g., Mobile App v2 Redesign"
              value={formData.projectName}
              onChange={e => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="proj-desc">
              Description & Objectives
            </label>
            <textarea
              id="proj-desc"
              className="form-textarea"
              rows={3}
              placeholder="Outline project goals, scope, and key deliverables..."
              value={formData.description || ''}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="proj-dept">
                Owning Department <span className="required-star">*</span>
              </label>
              <select
                id="proj-dept"
                className="form-select"
                value={formData.departmentId}
                onChange={e => setFormData(prev => ({ ...prev, departmentId: Number(e.target.value) }))}
                required
              >
                <option value={0} disabled>
                  Select Department
                </option>
                {departments.map(d => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.departmentName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="proj-status">
                Status
              </label>
              <select
                id="proj-status"
                className="form-select"
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: Number(e.target.value) }))}
              >
                {PROJECT_STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="proj-start">
                Start Date <span className="required-star">*</span>
              </label>
              <input
                id="proj-start"
                type="date"
                className="form-input"
                value={formData.startDate}
                onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="proj-end">
                Target End Date
              </label>
              <input
                id="proj-end"
                type="date"
                className="form-input"
                value={formData.endDate || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    endDate: e.target.value ? e.target.value : undefined,
                  }))
                }
              />
            </div>
          </div>

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
                : editingProject
                ? 'Update Project'
                : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      <ConfirmModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        message={`Are you sure you want to delete "${projectToDelete?.projectName}"? All associated tasks will be removed.`}
        confirmText="Delete Project"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
