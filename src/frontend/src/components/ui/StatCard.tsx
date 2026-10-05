import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  colorScheme?: 'primary' | 'purple' | 'emerald' | 'amber' | 'rose' | 'cyan';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorScheme = 'primary',
}) => {
  const schemeStyles: Record<string, { glow: string; iconBg: string; iconColor: string }> = {
    primary: {
      glow: 'rgba(99, 102, 241, 0.15)',
      iconBg: 'rgba(99, 102, 241, 0.12)',
      iconColor: 'var(--primary)',
    },
    purple: {
      glow: 'rgba(139, 92, 246, 0.15)',
      iconBg: 'rgba(139, 92, 246, 0.12)',
      iconColor: '#8b5cf6',
    },
    emerald: {
      glow: 'rgba(16, 185, 129, 0.15)',
      iconBg: 'rgba(16, 185, 129, 0.12)',
      iconColor: '#10b981',
    },
    amber: {
      glow: 'rgba(245, 158, 11, 0.15)',
      iconBg: 'rgba(245, 158, 11, 0.12)',
      iconColor: '#f59e0b',
    },
    rose: {
      glow: 'rgba(244, 63, 94, 0.15)',
      iconBg: 'rgba(244, 63, 94, 0.12)',
      iconColor: '#f43f5e',
    },
    cyan: {
      glow: 'rgba(6, 182, 212, 0.15)',
      iconBg: 'rgba(6, 182, 212, 0.12)',
      iconColor: '#06b6d4',
    },
  };

  const scheme = schemeStyles[colorScheme] || schemeStyles.primary;

  return (
    <div
      className="glass-card glass-card-interactive"
      style={{
        padding: '20px 24px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '120px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {title}
          </span>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {value}
          </div>
        </div>
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: 'var(--radius-lg)',
            background: scheme.iconBg,
            color: scheme.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 12px ${scheme.glow}`,
          }}
        >
          {icon}
        </div>
      </div>

      {(subtitle || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
          {trend && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: trend.isPositive ? '#10b981' : '#ef4444',
                background: trend.isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
};
