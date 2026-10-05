import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-md)',
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div
      className="glass-card"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="40%" height="24px" />
        <Skeleton width="60px" height="20px" borderRadius="var(--radius-full)" />
      </div>
      <Skeleton width="90%" height="16px" />
      <Skeleton width="75%" height="16px" />
      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="80px" height="20px" />
        <Skeleton width="100px" height="28px" borderRadius="var(--radius-md)" />
      </div>
    </div>
  );
};
