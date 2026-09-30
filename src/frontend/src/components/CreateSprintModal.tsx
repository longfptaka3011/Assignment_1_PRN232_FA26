import React, { useState } from 'react';
import { X, Plus, Calendar } from 'lucide-react';

interface CreateSprintModalProps {
  onClose: () => void;
  onCreate: (data: { name: string; goal?: string; startDate?: string; endDate?: string }) => void;
}

export const CreateSprintModal: React.FC<CreateSprintModalProps> = ({
  onClose,
  onCreate
}) => {
  const [name, setName] = useState('Sprint 2');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      goal: goal.trim() || undefined,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Sprint</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-body">
          <div className="form-group">
            <label className="form-label">Sprint Name <span className="req">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sprint Goal</label>
            <textarea
              placeholder="What is the objective of this sprint iteration?"
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-row-grid">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} />
              <span>Create Sprint</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
