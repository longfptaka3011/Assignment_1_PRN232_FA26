import React, { useState, useEffect } from 'react';
import { ProjectDetail, Sprint, SprintBurndown, SprintVelocity, MemberWorkload } from '../types';
import { api } from '../services/api';
import { useThemeAndLangStore } from '../stores/themeAndLangStore';
import {
  BarChart3,
  TrendingDown,
  Users,
  RefreshCw
} from 'lucide-react';

interface AgileReportsViewProps {
  project: ProjectDetail;
  activeSprint?: Sprint;
}

export const AgileReportsView: React.FC<AgileReportsViewProps> = ({ project, activeSprint }) => {
  const { t } = useThemeAndLangStore();
  const [activeTab, setActiveTab] = useState<'burndown' | 'velocity' | 'workload'>('burndown');
  const [burndownMetric, setBurndownMetric] = useState<'storyPoints' | 'issueCount'>('storyPoints');
  const [loading, setLoading] = useState(true);

  const [burndown, setBurndown] = useState<SprintBurndown | null>(null);
  const [velocity, setVelocity] = useState<SprintVelocity[]>([]);
  const [workload, setWorkload] = useState<MemberWorkload[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSprint) {
        const bd = await api.getSprintBurndown(activeSprint.id);
        setBurndown(bd);
      }
      const [vel, wl] = await Promise.all([
        api.getProjectVelocity(project.id),
        api.getWorkloadDistribution(project.id, activeSprint?.id)
      ]);
      setVelocity(vel);
      setWorkload(wl);
    } catch (err) {
      console.error('Failed to load agile reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [project.id, activeSprint?.id]);

  return (
    <div className="reports-view" style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto', color: 'var(--text-primary)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={28} style={{ color: 'var(--accent-primary)' }} />
            {t('nav.reports') || 'Báo Cáo Agile & Dashboard'}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            Theo dõi tiến độ Sprint, tốc độ hoàn thành và phân bổ công việc của dự án {project.name}.
          </p>
        </div>

        <button
          onClick={loadData}
          className="btn-glass"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border-color)', background: 'var(--bg-glass)' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Report Navigation Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('burndown')}
          className={`tab-btn ${activeTab === 'burndown' ? 'active' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'burndown' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'burndown' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <TrendingDown size={18} />
          <span>Biểu đồ Burndown</span>
        </button>

        <button
          onClick={() => setActiveTab('velocity')}
          className={`tab-btn ${activeTab === 'velocity' ? 'active' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'velocity' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'velocity' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <BarChart3 size={18} />
          <span>Vận Tốc Sprint (Velocity)</span>
        </button>

        <button
          onClick={() => setActiveTab('workload')}
          className={`tab-btn ${activeTab === 'workload' ? 'active' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'workload' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'workload' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Users size={18} />
          <span>Phân Bổ Công Việc (Workload)</span>
        </button>
      </div>

      {/* Tab 1: Burndown Chart */}
      {activeTab === 'burndown' && (
        <div>
          {/* Sprint Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-glass)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Sprint Đang Chạy</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{burndown?.sprintName || activeSprint?.name || 'Sprint 1'}</div>
            </div>

            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-glass)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Tổng Story Points</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-primary)' }}>{burndown?.totalStoryPoints ?? activeSprint?.totalStoryPoints ?? 16} pts</div>
            </div>

            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-glass)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Số Điểm Còn Lại</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b' }}>
                {burndown?.dataPoints[burndown.dataPoints.length - 1]?.remainingStoryPoints ?? 13} pts
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-glass)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Tổng Số Issues</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>{burndown?.totalIssues ?? activeSprint?.issueCount ?? 4} tasks</div>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-glass)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>Biểu Đồ Tiến Độ (Burndown Curve)</h3>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '3px', background: '#38bdf8', display: 'inline-block' }}></span>
                    <span style={{ color: 'var(--text-secondary)' }}>Đường lý tưởng (Ideal Guideline)</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '3px', background: '#a855f7', display: 'inline-block' }}></span>
                    <span style={{ color: 'var(--text-secondary)' }}>Tiến độ thực tế (Actual Remaining)</span>
                  </span>
                </div>
              </div>

              {/* Metric Toggle */}
              <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => setBurndownMetric('storyPoints')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: burndownMetric === 'storyPoints' ? 'var(--accent-primary)' : 'transparent',
                    color: burndownMetric === 'storyPoints' ? '#fff' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Story Points
                </button>
                <button
                  onClick={() => setBurndownMetric('issueCount')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: burndownMetric === 'issueCount' ? 'var(--accent-primary)' : 'transparent',
                    color: burndownMetric === 'issueCount' ? '#fff' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Số Lượng Issues
                </button>
              </div>
            </div>

            {/* SVG Rendered Burndown Chart */}
            {burndown && burndown.dataPoints.length > 1 ? (
              <div style={{ width: '100%', height: '340px', overflowX: 'auto' }}>
                <svg viewBox="0 0 800 300" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="actualGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = 30 + ratio * 230;
                    const maxVal = burndownMetric === 'storyPoints' ? burndown.totalStoryPoints : burndown.totalIssues;
                    const val = Math.round((1 - ratio) * maxVal);
                    return (
                      <g key={idx}>
                        <line x1="60" y1={y} x2="780" y2={y} stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.4" />
                        <text x="45" y={y + 4} fill="var(--text-muted)" fontSize="11" textAnchor="end">{val}</text>
                      </g>
                    );
                  })}

                  {/* Generate Coordinate Paths */}
                  {(() => {
                    const points = burndown.dataPoints;
                    const maxVal = Math.max(1, burndownMetric === 'storyPoints' ? burndown.totalStoryPoints : burndown.totalIssues);
                    const stepX = (780 - 60) / (points.length - 1);

                    // Ideal Path
                    const idealPath = points.map((p, i) => {
                      const x = 60 + i * stepX;
                      const val = burndownMetric === 'storyPoints' ? p.idealStoryPoints : (burndown.totalIssues * (1 - i / (points.length - 1)));
                      const y = 260 - (val / maxVal) * 230;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ');

                    // Actual Path
                    const actualCoords = points.map((p, i) => {
                      const x = 60 + i * stepX;
                      const val = burndownMetric === 'storyPoints' ? p.remainingStoryPoints : p.remainingIssues;
                      const y = 260 - (val / maxVal) * 230;
                      return { x, y, val, date: p.date };
                    });

                    const actualPath = actualCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
                    const areaPath = `${actualPath} L ${actualCoords[actualCoords.length - 1].x} 260 L ${actualCoords[0].x} 260 Z`;

                    return (
                      <>
                        {/* Shaded Area for actual */}
                        <path d={areaPath} fill="url(#actualGradient)" />

                        {/* Ideal Line (Dashed Cyan) */}
                        <path d={idealPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="6 4" />

                        {/* Actual Line (Solid Violet) */}
                        <path d={actualPath} fill="none" stroke="#a855f7" strokeWidth="3" />

                        {/* Points & Labels */}
                        {actualCoords.map((c, i) => (
                          <g key={i}>
                            <circle cx={c.x} cy={c.y} r="4.5" fill="#a855f7" stroke="#ffffff" strokeWidth="2" />
                            {/* X-axis labels */}
                            <text x={c.x} y="280" fill="var(--text-muted)" fontSize="10" textAnchor="middle">
                              {c.date.slice(5)}
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Đang nạp dữ liệu Sprint Burndown...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Velocity Chart */}
      {activeTab === 'velocity' && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-glass)' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '600' }}>Biểu Đồ Vận Tốc Sprint (Committed vs Completed)</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
              So sánh số lượng Story Points đội nhóm cam kết đầu Sprint và thực tế đã hoàn thành.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {velocity.map((v) => (
              <div key={v.sprintId} style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '12px' }}>{v.sprintName}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Cam kết (Committed):</span>
                  <span style={{ fontWeight: '700', color: '#38bdf8' }}>{v.committedStoryPoints} pts</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Hoàn thành (Completed):</span>
                  <span style={{ fontWeight: '700', color: '#10b981' }}>{v.completedStoryPoints} pts</span>
                </div>
                
                {/* Visual Ratio Bar */}
                <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, (v.completedStoryPoints / Math.max(1, v.committedStoryPoints)) * 100)}%`,
                      background: 'linear-gradient(90deg, #38bdf8, #10b981)',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div style={{ fontSize: '12px', textAlign: 'right', marginTop: '6px', color: 'var(--text-muted)' }}>
                  {Math.round((v.completedStoryPoints / Math.max(1, v.committedStoryPoints)) * 100)}% mục tiêu
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Workload Distribution */}
      {activeTab === 'workload' && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-glass)' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '600' }}>Phân Bổ Khối Lượng Công Việc Theo Thành Viên</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
              Theo dõi số Story Points và tỉ lệ hoàn thành nhiệm vụ của từng thành viên trong nhóm.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {workload.map((m, idx) => (
              <div
                key={m.userId || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  padding: '16px 20px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                  {m.userAvatarUrl ? (
                    <img src={m.userAvatarUrl} alt={m.userName} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                      {m.userName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{m.userName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.issueCount} issues được giao</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span>{m.completedStoryPoints} / {m.totalStoryPoints} Story Points</span>
                    <span style={{ fontWeight: '600', color: '#10b981' }}>
                      {m.totalStoryPoints > 0 ? Math.round((m.completedStoryPoints / m.totalStoryPoints) * 100) : 0}%
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${m.totalStoryPoints > 0 ? (m.completedStoryPoints / m.totalStoryPoints) * 100 : 0}%`,
                        background: '#10b981',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', minWidth: '160px', justifyContent: 'flex-end' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontWeight: '600' }}>
                    {m.totalStoryPoints} pts
                  </span>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: '600' }}>
                    {m.completedIssueCount} xong
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
