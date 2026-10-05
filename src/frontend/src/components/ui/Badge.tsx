import React from 'react';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'custom';
  color?: string;
  dot?: boolean;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  color,
  dot = true,
  size = 'md',
}) => {
  if (color || variant === 'custom') {
    const bg = color ? `${color}1A` : 'rgba(99, 102, 241, 0.12)';
    const text = color || 'var(--primary)';
    const border = color ? `${color}40` : 'rgba(99, 102, 241, 0.25)';

    return (
      <span
        className="badge"
        style={{
          backgroundColor: bg,
          color: text,
          border: `1px solid ${border}`,
          padding: size === 'sm' ? '2px 6px' : '3px 9px',
          fontSize: size === 'sm' ? '0.6875rem' : '0.75rem',
        }}
      >
        {dot && <span className="badge-dot" style={{ backgroundColor: text }} />}
        {label}
      </span>
    );
  }

  const variantStyles: Record<string, { bg: string; text: string; border: string }> = {
    primary: {
      bg: 'var(--primary-subtle)',
      text: 'var(--primary)',
      border: 'rgba(99, 102, 241, 0.25)',
    },
    success: {
      bg: 'rgba(16, 185, 129, 0.12)',
      text: '#10b981',
      border: 'rgba(16, 185, 129, 0.25)',
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.12)',
      text: '#f59e0b',
      border: 'rgba(245, 158, 11, 0.25)',
    },
    danger: {
      bg: 'rgba(239, 68, 68, 0.12)',
      text: '#ef4444',
      border: 'rgba(239, 68, 68, 0.25)',
    },
    info: {
      bg: 'rgba(59, 130, 246, 0.12)',
      text: '#3b82f6',
      border: 'rgba(59, 130, 246, 0.25)',
    },
    neutral: {
      bg: 'var(--bg-secondary)',
      text: 'var(--text-secondary)',
      border: 'var(--border-base)',
    },
  };

  const style = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className="badge"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        padding: size === 'sm' ? '2px 6px' : '3px 9px',
        fontSize: size === 'sm' ? '0.6875rem' : '0.75rem',
      }}
    >
      {dot && <span className="badge-dot" style={{ backgroundColor: style.text }} />}
      {label}
    </span>
  );
};

export const TaskStatusBadge: React.FC<{ status: number; statusName?: string }> = ({ status, statusName }) => {
  switch (status) {
    case 0:
      return <Badge label={statusName || 'To Do'} variant="neutral" />;
    case 1:
      return <Badge label={statusName || 'In Progress'} variant="info" />;
    case 2:
      return <Badge label={statusName || 'Done'} variant="success" />;
    case 3:
      return <Badge label={statusName || 'Cancelled'} variant="danger" />;
    default:
      return <Badge label={statusName || `Status ${status}`} variant="neutral" />;
  }
};

export const PriorityBadge: React.FC<{ priority: number; priorityName?: string }> = ({ priority, priorityName }) => {
  switch (priority) {
    case 0:
      return <Badge label={priorityName || 'Low'} variant="success" />;
    case 1:
      return <Badge label={priorityName || 'Medium'} variant="warning" />;
    case 2:
      return <Badge label={priorityName || 'High'} color="#f97316" />;
    case 3:
      return <Badge label={priorityName || 'Critical'} variant="danger" />;
    default:
      return <Badge label={priorityName || `Priority ${priority}`} variant="neutral" />;
  }
};
