import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Building2,
  Edit2,
  Trash2,
  X,
  LayoutGrid,
  Table as TableIcon,
  FolderKanban,
} from 'lucide-react';
import { departmentApi } from '../services/api';
import type { Department, CreateDepartmentDto, UpdateDepartmentDto } from '../types';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import './DepartmentList.css';

export default function DepartmentList() {
  const toast = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchName, setSearchName] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateDepartmentDto>({
    departmentName: '',
    departmentDescription: '',
  });

  const fetchDepartments = useCallback(async () => {
    try {
      let data: Department[];
      if (searchName.trim()) {
        data = await departmentApi.search(searchName.trim());
      } else {
        data = await departmentApi.getAll();
      }
      setDepartments(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch departments.');
    } finally {
      setLoading(false);
    }
  }, [searchName, toast]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const openDeptModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        departmentName: dept.departmentName,
        departmentDescription: dept.departmentDescription || '',
      });
    } else {
      setEditingDept(null);
      setFormData({
        departmentName: '',
        departmentDescription: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departmentName.trim()) {
      toast.warning('Department name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDept) {
        await departmentApi.update(editingDept.departmentId, formData as UpdateDepartmentDto);
        toast.success(`Department "${formData.departmentName}" updated.`);
      } else {
        await departmentApi.create(formData);
        toast.success(`Department "${formData.departmentName}" created.`);
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deptToDelete) return;
    setIsDeleting(true);
    try {
      await departmentApi.delete(deptToDelete.departmentId);
      toast.success(`Department "${deptToDelete.departmentName}" deleted.`);
      setDeptToDelete(null);
      fetchDepartments();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete department. Please make sure no projects are linked to it.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="departments-page-container">
      {/* ==================== PAGE HEADER ==================== */}
      <div className="page-header-bar">
        <div>
          <h1 className="page-main-title">Departments & Teams</h1>
          <p className="page-sub-title">
            Configure organizational units, team ownerships, and functional divisions.
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

          <button className="btn-primary-action" onClick={() => openDeptModal()}>
            <Plus size={16} strokeWidth={2.5} />
            <span>New Department</span>
          </button>
        </div>
      </div>

      {/* ==================== SEARCH BAR ==================== */}
      <div className="filter-toolbar-card">
        <div className="search-pill-box">
          <Search size={15} className="search-pill-icon" />
          <input
            type="text"
            className="search-pill-input"
            placeholder="Search departments by name..."
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
          />
          {searchName && (
            <button className="clear-pill-btn" onClick={() => setSearchName('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="dept-summary-pill">
          <span>{departments.length} Units Active</span>
        </div>
      </div>

      {/* ==================== CONTENT VIEW ==================== */}
      {loading ? (
        <div className="departments-grid-layout">
          <Skeleton height="180px" borderRadius="14px" />
          <Skeleton height="180px" borderRadius="14px" />
          <Skeleton height="180px" borderRadius="14px" />
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          title="No departments found"
          description="Create your first department or adjust your search keywords."
          actionText="Create Department"
          onAction={() => openDeptModal()}
        />
      ) : viewMode === 'table' ? (
        /* ==================== CLEAN DATA TABLE ==================== */
        <div className="clean-table-container">
          <table className="clean-saas-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Department Name</th>
                <th style={{ width: '40%' }}>Description</th>
                <th style={{ width: '15%' }}>Projects Count</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map(dept => {
                const projectCount = dept.projects ? dept.projects.length : 0;
                return (
                  <tr key={dept.departmentId}>
                    <td>
                      <div className="table-dept-name-cell">
                        <Link to={`/departments/${dept.departmentId}`} className="table-dept-title-link">
                          <Building2 size={14} className="cell-icon" />
                          <span>{dept.departmentName}</span>
                        </Link>
                      </div>
                    </td>
                    <td>
                      <span className="table-desc-cell">
                        {dept.departmentDescription || 'No description provided.'}
                      </span>
                    </td>
                    <td>
                      <span className="table-stat-badge">
                        <FolderKanban size={13} className="cell-icon" />
                        <span>{projectCount} Projects</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions-cell">
                        <button
                          className="table-icon-btn"
                          onClick={() => openDeptModal(dept)}
                          title="Edit Department"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="table-icon-btn delete-btn"
                          onClick={() => setDeptToDelete(dept)}
                          title="Delete Department"
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
        /* ==================== CLEAN CARDS GRID ==================== */
        <div className="departments-grid-layout">
          {departments.map(dept => {
            const projectCount = dept.projects ? dept.projects.length : 0;

            return (
              <div key={dept.departmentId} className="dept-saas-card">
                <div className="dept-card-top">
                  <div className="dept-icon-box">
                    <Building2 size={20} />
                  </div>
                  <div className="card-icon-actions">
                    <button
                      className="table-icon-btn"
                      onClick={() => openDeptModal(dept)}
                      title="Edit Department"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="table-icon-btn delete-btn"
                      onClick={() => setDeptToDelete(dept)}
                      title="Delete Department"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <Link to={`/departments/${dept.departmentId}`} className="card-title-link">
                  <h3 className="card-main-title">{dept.departmentName}</h3>
                </Link>

                <p className="card-desc-text">
                  {dept.departmentDescription || 'Operational department.'}
                </p>

                <div className="dept-card-footer">
                  <span className="table-stat-badge">
                    <FolderKanban size={13} />
                    <span>{projectCount} Active Projects</span>
                  </span>
                  <Link to={`/departments/${dept.departmentId}`} className="card-view-link">
                    Explore →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== CREATE / EDIT MODAL ==================== */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingDept ? 'Edit Department' : 'Create New Department'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label className="form-label" htmlFor="dept-name">
              Department Name <span className="required-star">*</span>
            </label>
            <input
              id="dept-name"
              type="text"
              className="form-input"
              placeholder="e.g., Engineering, Design, Product"
              value={formData.departmentName}
              onChange={e => setFormData(prev => ({ ...prev, departmentName: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dept-desc">
              Description & Purpose
            </label>
            <textarea
              id="dept-desc"
              className="form-textarea"
              rows={3}
              placeholder="Briefly describe the unit's responsibilities and mandate..."
              value={formData.departmentDescription}
              onChange={e =>
                setFormData(prev => ({ ...prev, departmentDescription: e.target.value }))
              }
            />
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
                : editingDept
                ? 'Update Department'
                : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== DELETE CONFIRM MODAL ==================== */}
      <ConfirmModal
        isOpen={!!deptToDelete}
        onClose={() => setDeptToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        message={`Are you sure you want to delete "${deptToDelete?.departmentName}"? Projects assigned to this department must be reassigned first.`}
        confirmText="Delete Department"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
