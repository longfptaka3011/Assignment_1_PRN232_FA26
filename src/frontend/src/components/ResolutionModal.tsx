import React, { useState } from 'react';
import { Issue } from '../types';
import { CheckCircle2, X } from 'lucide-react';

interface ResolutionModalProps {
  issue: Issue | null;
  targetStatusName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (resolution: string, comment?: string) => Promise<void>;
}

export const ResolutionModal: React.FC<ResolutionModalProps> = ({
  issue,
  targetStatusName,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [resolution, setResolution] = useState('Done');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !issue) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(resolution, comment.trim() ? comment.trim() : undefined);
      onClose();
    } catch (err) {
      console.error('Failed to submit resolution:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '20px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--bg-primary)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={22} style={{ color: '#10b981' }} />
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>Hoàn Thành Issue & Resolution</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', fontSize: '13px' }}>
            <span style={{ fontWeight: '700', color: 'var(--accent-primary)', marginRight: '6px' }}>{issue.issueKey}:</span>
            <span>{issue.title}</span>
            <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Chuyển sang trạng thái: <strong style={{ color: '#10b981' }}>{targetStatusName}</strong>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              Kết quả giải quyết (Resolution) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}
            >
              <option value="Done">Done (Đã hoàn thành)</option>
              <option value="Fixed">Fixed (Đã sửa xong lỗi)</option>
              <option value="Won't Fix">Won't Fix (Không thực hiện)</option>
              <option value="Duplicate">Duplicate (Trùng lặp)</option>
              <option value="Cannot Reproduce">Cannot Reproduce (Không tái hiện được)</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              Ghi chú hoàn thành (Comment)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Nhập ghi chú hoặc kết quả kiểm thử (nếu có)..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#10b981',
                color: '#fff',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: '600'
              }}
            >
              {submitting ? 'Đang cập nhật...' : 'Xác nhận hoàn thành'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
