import React from 'react';
import { FolderSearch, Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        textAlign: 'center',
        background: 'var(--bg-card)',
        border: '1px dashed var(--border-base)',
        borderRadius: 'var(--radius-xl)',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-secondary)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        {icon || <FolderSearch size={32} />}
      </div>
      <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
        {title}
      </h4>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '20px' }}>
        {description}
      </p>
      {actionText && onAction && (
        <button className="btn btn-primary btn-sm" onClick={onAction}>
          <Plus size={16} />
          {actionText}
        </button>
      )}
    </div>
  );
};
