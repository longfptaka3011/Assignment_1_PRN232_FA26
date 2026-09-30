import React, { useState } from 'react';
import { ProjectDetail, IssuePriority } from '../types';
import { X, Plus, Sparkles } from 'lucide-react';

interface CreateIssueModalProps {
  project: ProjectDetail;
  initialStatusId?: string;
  initialSprintId?: string;
  onClose: () => void;
  onCreate: (data: {
    projectId: string;
    title: string;
    description?: string;
    typeId: string;
    statusId?: string;
    priority?: IssuePriority;
    assigneeId?: string;
    sprintId?: string;
    storyPoints?: number;
  }) => void;
}

export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  project,
  initialStatusId,
  initialSprintId,
  onClose,
  onCreate
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [typeId, setTypeId] = useState(project.issueTypes[1]?.id || project.issueTypes[0]?.id || '');
  const [statusId, setStatusId] = useState(initialStatusId || project.issueStatuses[1]?.id || project.issueStatuses[0]?.id || '');
  const [priority, setPriority] = useState<IssuePriority>('Medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [sprintId, setSprintId] = useState<string>(initialSprintId || '');
  const [storyPoints, setStoryPoints] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !typeId) return;

    onCreate({
      projectId: project.id,
      title: title.trim(),
      description: description.trim() || undefined,
      typeId,
      statusId: statusId || undefined,
      priority,
      assigneeId: assigneeId || undefined,
      sprintId: sprintId || undefined,
      storyPoints: storyPoints ? parseFloat(storyPoints) : undefined
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-title-wrap">
            <h2 className="modal-title">Create Issue</h2>
            <span className="badge badge-key">{project.key}</span>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="modal-form-body">
          {/* Issue Type */}
          <div className="form-group">
            <label className="form-label">Issue Type <span className="req">*</span></label>
            <select
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              className="form-control"
              required
            >
              {project.issueTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label">Summary / Title <span className="req">*</span></label>
            <input
              type="text"
              placeholder="What needs to be accomplished?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-control"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              placeholder="Add extra context, specifications, or checklist..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control"
            />
          </div>

          {/* Row of dropdowns */}
          <div className="form-row-grid">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="form-control"
              >
                {project.issueStatuses.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
                className="form-control"
              >
                <option value="Urgent">🔴 Urgent</option>
                <option value="High">🟠 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🔵 Low</option>
                <option value="Lowest">⚪ Lowest</option>
              </select>
            </div>
          </div>

          <div className="form-row-grid">
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="form-control"
              >
                <option value="">Unassigned</option>
                {project.members.map(m => (
                  <option key={m.userId} value={m.userId}>{m.fullName}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Story Points</label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="1, 2, 3, 5, 8..."
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} />
              <span>Create Issue</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
