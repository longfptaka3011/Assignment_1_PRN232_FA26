import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Palette,
  Check,
} from 'lucide-react';
import { tagApi } from '../services/api';
import type { Tag, CreateTagDto, UpdateTagDto } from '../types';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import './TagList.css';

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#64748b', // Slate
];

export default function TagList() {
  const toast = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateTagDto>({
    tagName: '',
    color: '#6366f1',
  });

  const fetchTags = useCallback(async () => {
    try {
      const data = await tagApi.getAll();
      setTags(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tags.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const openTagModal = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        tagName: tag.tagName,
        color: tag.color || '#6366f1',
      });
    } else {
      setEditingTag(null);
      setFormData({
        tagName: '',
        color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tagName.trim()) {
      toast.warning('Tag name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTag) {
        await tagApi.update(editingTag.tagId, formData as UpdateTagDto);
        toast.success(`Tag "#${formData.tagName}" updated.`);
      } else {
        await tagApi.create(formData);
        toast.success(`Tag "#${formData.tagName}" created.`);
      }
      setShowModal(false);
      fetchTags();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save tag.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return;
    setIsDeleting(true);
    try {
      await tagApi.delete(tagToDelete.tagId);
      toast.success(`Tag "#${tagToDelete.tagName}" deleted.`);
      setTagToDelete(null);
      fetchTags();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete tag.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="tags-page-container">
      {/* ==================== PAGE HEADER ==================== */}
      <div className="page-header-bar">
        <div>
          <h1 className="page-main-title">Tags & Taxonomies</h1>
          <p className="page-sub-title">
            Define labels, categories, and priority badges used across task workflows.
          </p>
        </div>

        <button className="btn-primary-action" onClick={() => openTagModal()}>
          <Plus size={16} strokeWidth={2.5} />
          <span>New Tag</span>
        </button>
      </div>

      {/* ==================== TAGS GRID ==================== */}
      {loading ? (
        <div className="tags-grid-layout">
          <Skeleton height="110px" borderRadius="14px" />
          <Skeleton height="110px" borderRadius="14px" />
          <Skeleton height="110px" borderRadius="14px" />
          <Skeleton height="110px" borderRadius="14px" />
        </div>
      ) : tags.length === 0 ? (
        <EmptyState
          title="No tags created yet"
          description="Create custom taxonomy tags to organize and prioritize your tasks."
          actionText="Create Tag"
          onAction={() => openTagModal()}
        />
      ) : (
        <div className="tags-grid-layout">
          {tags.map(tag => {
            const tagColor = tag.color || '#6366f1';
            return (
              <div key={tag.tagId} className="tag-saas-card">
                <div className="tag-preview-col">
                  <span
                    className="tag-display-pill"
                    style={{
                      backgroundColor: `${tagColor}15`,
                      color: tagColor,
                      borderColor: `${tagColor}35`,
                    }}
                  >
                    <span className="tag-dot" style={{ backgroundColor: tagColor }} />
                    #{tag.tagName}
                  </span>
                  <span className="tag-hex-label">{tagColor}</span>
                </div>

                <div className="tag-actions-col">
                  <button
                    className="table-icon-btn"
                    onClick={() => openTagModal(tag)}
                    title="Edit Tag"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    className="table-icon-btn delete-btn"
                    onClick={() => setTagToDelete(tag)}
                    title="Delete Tag"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== CREATE / EDIT TAG MODAL ==================== */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTag ? 'Edit Tag' : 'Create New Tag'}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label className="form-label" htmlFor="tag-name">
              Tag Name <span className="required-star">*</span>
            </label>
            <div className="tag-input-prefix-box">
              <span className="input-hash-prefix">#</span>
              <input
                id="tag-name"
                type="text"
                className="form-input with-prefix"
                placeholder="e.g., Mobile UI, Frontend, Urgent"
                value={formData.tagName}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    tagName: e.target.value.replace(/^#/, ''),
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Palette size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Accent Color
            </label>
            <div className="color-palette-picker">
              {PRESET_COLORS.map(c => (
                <button
                  type="button"
                  key={c}
                  className={`color-swatch-circle ${formData.color === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setFormData(prev => ({ ...prev, color: c }))}
                >
                  {formData.color === c && <Check size={14} className="swatch-check" />}
                </button>
              ))}
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
              {isSubmitting ? 'Saving...' : editingTag ? 'Update Tag' : 'Create Tag'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== DELETE CONFIRM MODAL ==================== */}
      <ConfirmModal
        isOpen={!!tagToDelete}
        onClose={() => setTagToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Tag"
        message={`Are you sure you want to delete "#${tagToDelete?.tagName}"? It will be removed from all associated tasks.`}
        confirmText="Delete Tag"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
