import React from 'react';
import { Project, Sprint } from '../types';
import { useThemeAndLang } from '../stores/themeAndLangStore';
import { 
  LayoutDashboard, 
  Layers, 
  BarChart3,
  Users, 
  Zap, 
  UserCheck,
  FileSpreadsheet
} from 'lucide-react';

interface SidebarProps {
  currentView: 'board' | 'backlog' | 'reports' | 'settings';
  onSelectView: (view: 'board' | 'backlog' | 'reports' | 'settings') => void;
  currentProject: Project;
  activeSprint?: Sprint;
  filterAssigneeId: string | null;
  onFilterAssignee: (id: string | null) => void;
  onOpenCsvModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  currentProject,
  activeSprint,
  filterAssigneeId,
  onFilterAssignee,
  onOpenCsvModal
}) => {
  const { t } = useThemeAndLang();
  const currentUserId = '11111111-1111-1111-1111-111111111111'; // Alex Dev
  const isMyIssues = filterAssigneeId === currentUserId;

  return (
    <aside className="sidebar glass-panel" id="main-sidebar">
      {/* Primary Navigation */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">PLANNING</div>
        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${currentView === 'board' ? 'active' : ''}`}
            id="nav-board-btn"
            onClick={() => onSelectView('board')}
          >
            <LayoutDashboard size={18} />
            <span>{t('kanbanBoard')}</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentView === 'backlog' ? 'active' : ''}`}
            id="nav-backlog-btn"
            onClick={() => onSelectView('backlog')}
          >
            <Layers size={18} />
            <span>{t('backlogSprints')}</span>
            {activeSprint && <span className="sidebar-pill">Active</span>}
          </button>

          <button
            className={`sidebar-nav-item ${currentView === 'reports' ? 'active' : ''}`}
            id="nav-reports-btn"
            onClick={() => onSelectView('reports')}
          >
            <BarChart3 size={18} />
            <span>{t('reports')}</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentView === 'settings' ? 'active' : ''}`}
            id="nav-settings-btn"
            onClick={() => onSelectView('settings')}
          >
            <Users size={18} />
            <span>{t('teamSettings')}</span>
          </button>
        </nav>
      </div>

      {/* Quick Actions & Filters */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">QUICK ACTIONS</div>
        <div className="quick-filters" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className={`quick-filter-chip ${isMyIssues ? 'active' : ''}`}
            id="filter-my-issues-btn"
            onClick={() => onFilterAssignee(isMyIssues ? null : currentUserId)}
          >
            <UserCheck size={14} />
            <span>{t('onlyMyIssues')}</span>
          </button>

          {onOpenCsvModal && (
            <button
              className="quick-filter-chip"
              id="open-csv-btn"
              onClick={onOpenCsvModal}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <FileSpreadsheet size={14} className="text-primary" />
              <span>{t('exportImportCsv')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Sprint Mini Card */}
      {activeSprint && (
        <div className="sidebar-sprint-widget glass-panel" id="sidebar-sprint-widget">
          <div className="sprint-widget-header">
            <div className="sprint-icon-title">
              <Zap size={14} className="sprint-zap-icon" />
              <span className="sprint-title-text">{activeSprint.name}</span>
            </div>
            <span className="badge badge-active">Live</span>
          </div>

          <p className="sprint-goal-text">{activeSprint.goal || 'No sprint goal set.'}</p>

          <div className="sprint-progress-wrap">
            <div className="progress-labels">
              <span>Points Delivered</span>
              <span className="points-counter">
                {activeSprint.completedStoryPoints} / {activeSprint.totalStoryPoints} pts
              </span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${activeSprint.totalStoryPoints > 0 ? (activeSprint.completedStoryPoints / activeSprint.totalStoryPoints) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Project Meta Footer */}
      <div className="sidebar-footer">
        <div className="project-meta-box">
          <div className="meta-row">
            <span className="meta-label">Project Key</span>
            <span className="badge badge-key">{currentProject.key}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Total Issues</span>
            <span className="meta-value">{currentProject.issueCount}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Team Members</span>
            <span className="meta-value">{currentProject.memberCount} members</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
