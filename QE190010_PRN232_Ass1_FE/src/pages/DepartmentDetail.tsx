import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  FolderKanban,
  Calendar,
  Layers,
  ExternalLink,
  Plus,
  Edit2,
  ChevronRight,
  Home,
} from 'lucide-react';
import { departmentApi, projectApi } from '../services/api';
import type { Department, CreateProjectDto, UpdateDepartmentDto } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';
import './DetailPages.css';

export default function DepartmentDetail() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [dept, setDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick Action Modals
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState<UpdateDepartmentDto>({
    departmentName: '',
    departmentDescription: '',
  });

  const [showAddProjModal, setShowAddProjModal] = useState(false);
  const [projForm, setProjForm] = useState<CreateProjectDto>({
    projectName: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: undefined,
    status: 0,
    departmentId: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDepartmentData = useCallback(async () => {
    if (!id) return;
    try {
      const data = await departmentApi.getById(Number(id));
      setDept(data);
      if (data) {
        setDeptForm({
          departmentName: data.departmentName,
          departmentDescription: data.departmentDescription || '',
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load department details.');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchDepartmentData();
  }, [fetchDepartmentData]);

  const handleEditDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.departmentName.trim() || !dept) return;

    setIsSubmitting(true);
    try {
      await departmentApi.update(dept.departmentId, deptForm);
      toast.success(`Department "${deptForm.departmentName}" updated successfully.`);
      setShowEditDeptModal(false);
      fetchDepartmentData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddProjSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projForm.projectName.trim() || !dept) return;

    setIsSubmitting(true);
    try {
      await projectApi.create({ ...projForm, departmentId: dept.departmentId });
      toast.success(`Project "${projForm.projectName}" created under ${dept.departmentName}.`);
      setShowAddProjModal(false);
      fetchDepartmentData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
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

  if (!dept) {
    return (
      <div className="detail-page-container">
        <EmptyState
          title="Department Not Found"
          description="The department you are looking for does not exist or has been removed."
          actionText="Back to Departments"
          onAction={() => window.history.back()}
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
        <Link to="/departments" className="breadcrumb-item">
          <span>Departments</span>
        </Link>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <span className="breadcrumb-item breadcrumb-current">{dept.departmentName}</span>
      </nav>

      {/* Header hero card */}
      <div className="glass-card detail-hero-card">
        <div className="detail-hero-header">
          <div className="detail-hero-icon">
            <Building2 size={32} />
          </div>
          <div className="detail-hero-meta">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="detail-title">{dept.departmentName}</h1>
              <Badge
                label={dept.isActive ? 'Active' : 'Inactive'}
                variant={dept.isActive ? 'success' : 'neutral'}
              />
            </div>
            <p className="detail-desc">
              {dept.departmentDescription || 'No description provided for this department.'}
            </p>
          </div>
        </div>

        <div className="detail-hero-footer">
          <div className="detail-stat-pill">
            <Layers size={14} />
            <span>{dept.projects ? dept.projects.length : 0} Linked Projects</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowEditDeptModal(true)}>
              <Edit2 size={14} />
              <span>Edit Department</span>
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setProjForm({
                  projectName: '',
                  description: '',
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: undefined,
                  status: 0,
                  departmentId: dept.departmentId,
                });
                setShowAddProjModal(true);
              }}
            >
              <Plus size={14} />
              <span>Add Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="detail-section">
        <div className="section-header-row">
          <div>
            <h2 className="detail-section-title">Department Projects</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              All initiatives currently managed under {dept.departmentName}
            </p>
          </div>
          <span className="badge-pill">{dept.projects ? dept.projects.length : 0} Projects</span>
        </div>

        {!dept.projects || dept.projects.length === 0 ? (
          <EmptyState
            title="No projects linked yet"
            description="There are currently no active projects assigned to this department."
            actionText="Create First Project"
            onAction={() => setShowAddProjModal(true)}
          />
        ) : (
          <div className="detail-cards-grid">
            {dept.projects.map(proj => (
              <Link
                key={proj.projectId}
                to={`/projects/${proj.projectId}`}
                className="glass-card detail-sub-card"
              >
                <div className="sub-card-top">
                  <div className="sub-card-title-group">
                    <FolderKanban size={18} className="sub-card-icon" />
                    <h3 className="sub-card-title">{proj.projectName}</h3>
                  </div>
                  <ExternalLink size={14} className="external-icon" />
                </div>

                {proj.description && <p className="sub-card-desc">{proj.description}</p>}

                <div className="sub-card-bottom">
                  <div className="sub-card-date">
                    <Calendar size={12} />
                    <span>{new Date(proj.startDate).toLocaleDateString()}</span>
                  </div>
                  <Badge
                    label={proj.statusName || (proj.status === 2 ? 'Completed' : 'In Progress')}
                    variant={proj.status === 2 ? 'success' : 'info'}
                    size="sm"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Edit Department Modal */}
      <Modal
        isOpen={showEditDeptModal}
        onClose={() => setShowEditDeptModal(false)}
        title="Edit Department"
        subtitle={`Updating ${dept.departmentName}`}
        maxWidth="md"
      >
        <form onSubmit={handleEditDeptSubmit}>
          <div className="form-group">
            <label className="form-label">Department Name *</label>
            <input
              type="text"
              className="form-input"
              value={deptForm.departmentName}
              onChange={e => setDeptForm({ ...deptForm, departmentName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={deptForm.departmentDescription}
              onChange={e => setDeptForm({ ...deptForm, departmentDescription: e.target.value })}
            />
          </div>
          <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowEditDeptModal(false)}
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

      {/* Add Project Modal */}
      <Modal
        isOpen={showAddProjModal}
        onClose={() => setShowAddProjModal(false)}
        title="Create Project"
        subtitle={`Owning Department: ${dept.departmentName}`}
        maxWidth="md"
      >
        <form onSubmit={handleAddProjSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Q4 Growth Initiative"
              value={projForm.projectName}
              onChange={e => setProjForm({ ...projForm, projectName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="Project scope and milestones..."
              value={projForm.description || ''}
              onChange={e => setProjForm({ ...projForm, description: e.target.value })}
            />
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
              <label className="form-label">End Date</label>
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
              onClick={() => setShowAddProjModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
