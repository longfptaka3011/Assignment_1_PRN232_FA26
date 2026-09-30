import React, { useState } from 'react';
import { Issue, Sprint, ProjectDetail } from '../types';
import { 
  Plus, 
  Play, 
  CheckCircle2, 
  Calendar, 
  ChevronRight, 
  ChevronDown, 
  Zap, 
  Layers, 
  MoreHorizontal,
  Bookmark,
  ClipboardList,
  Bug
} from 'lucide-react';

interface BacklogViewProps {
  project: ProjectDetail;
  sprints: Sprint[];
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onOpenCreateSprint: () => void;
  onStartSprint: (id: string) => void;
  onCompleteSprint: (id: string) => void;
  onMoveIssueToSprint: (issueId: string, sprintId: string | null) => void;
  onOpenCreateIssue: (sprintId?: string) => void;
}

export const BacklogView: React.FC<BacklogViewProps> = ({
  project,
  sprints,
  issues,
  onSelectIssue,
  onOpenCreateSprint,
  onStartSprint,
  onCompleteSprint,
  onMoveIssueToSprint,
  onOpenCreateIssue
}) => {
  const [collapsedSprints, setCollapsedSprints] = useState<Record<string, boolean>>({});

  const toggleSprint = (id: string) => {
    setCollapsedSprints(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const backlogIssues = issues.filter(i => !i.sprintId);

  const getTypeIcon = (category: string) => {
    switch (category) {
      case 'Epic': return <Bookmark size={14} className="type-icon epic" />;
      case 'Story': return <CheckCircle2 size={14} className="type-icon story" />;
      case 'Bug': return <Bug size={14} className="type-icon bug" />;
      default: return <ClipboardList size={14} className="type-icon task" />;
    }
  };

  return (
    <div className="backlog-view-container" id="backlog-view">
      <div className="board-header">
        <div>
          <h1 className="board-title">Backlog & Sprint Planning</h1>
          <p className="board-subtitle">Organize iterations, plan sprints, and estimate user story capacity.</p>
        </div>
        <div className="board-actions">
          <button 
            className="btn btn-secondary"
            id="btn-create-sprint"
            onClick={onOpenCreateSprint}
          >
            <Plus size={16} />
            <span>Create Sprint</span>
          </button>
        </div>
      </div>

      {/* Sprints Sections */}
      <div className="sprints-container">
        {sprints.map(sprint => {
          const sprintIssues = issues.filter(i => i.sprintId === sprint.id);
          const totalPoints = sprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
          const isCollapsed = collapsedSprints[sprint.id] || false;

          return (
            <div 
              key={sprint.id} 
              className={`sprint-card-panel glass-panel ${sprint.status === 'Active' ? 'sprint-active' : ''}`}
              id={`sprint-panel-${sprint.id}`}
            >
              {/* Sprint Header */}
              <div className="sprint-panel-header">
                <div className="sprint-header-left" onClick={() => toggleSprint(sprint.id)}>
                  <button className="collapse-toggle-btn">
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <div className="sprint-info">
                    <div className="sprint-title-badge-row">
                      <h2 className="sprint-name">{sprint.name}</h2>
                      <span className={`badge badge-sprint-${sprint.status.toLowerCase()}`}>
                        {sprint.status}
                      </span>
                    </div>
                    {sprint.goal && <p className="sprint-goal-subtitle">{sprint.goal}</p>}
                  </div>
                </div>

                <div className="sprint-header-right">
                  <div className="sprint-meta-points">
                    <span className="points-pill">{totalPoints} pts</span>
                    <span className="issues-count-pill">{sprintIssues.length} issues</span>
                  </div>

                  {sprint.status === 'Planned' && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => onStartSprint(sprint.id)}
                    >
                      <Play size={14} />
                      <span>Start Sprint</span>
                    </button>
                  )}

                  {sprint.status === 'Active' && (
                    <button 
                      className="btn btn-secondary btn-sm complete-btn"
                      onClick={() => onCompleteSprint(sprint.id)}
                    >
                      <CheckCircle2 size={14} />
                      <span>Complete Sprint</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sprint Issues List */}
              {!isCollapsed && (
                <div className="sprint-issues-list">
                  {sprintIssues.map(issue => (
                    <div 
                      key={issue.id} 
                      className="backlog-issue-row"
                      onClick={() => onSelectIssue(issue)}
                    >
                      <div className="issue-row-left">
                        {getTypeIcon(issue.typeCategory)}
                        <span className="badge badge-key small">{issue.issueKey}</span>
                        <span className="issue-row-title">{issue.title}</span>
                      </div>

                      <div className="issue-row-right">
                        <select
                          className="move-sprint-select"
                          value={issue.sprintId || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onMoveIssueToSprint(issue.id, e.target.value || null)}
                        >
                          <option value="">Move to Backlog</option>
                          {sprints.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>

                        <span 
                          className="issue-status-badge"
                          style={{ backgroundColor: `${issue.statusColorHex}22`, color: issue.statusColorHex }}
                        >
                          {issue.statusName}
                        </span>

                        {issue.storyPoints !== undefined && (
                          <span className="story-points-badge">{issue.storyPoints}</span>
                        )}

                        {issue.assigneeAvatarUrl ? (
                          <img src={issue.assigneeAvatarUrl} alt="" className="card-avatar small" />
                        ) : (
                          <div className="card-avatar small unassigned">?</div>
                        )}
                      </div>
                    </div>
                  ))}

                  {sprintIssues.length === 0 && (
                    <div className="empty-sprint-drop">
                      <span>No issues in this sprint. Drag or move backlog issues here.</span>
                    </div>
                  )}

                  <div className="sprint-add-row">
                    <button 
                      className="btn-ghost btn-sm"
                      onClick={() => onOpenCreateIssue(sprint.id)}
                    >
                      <Plus size={14} />
                      <span>Create issue in {sprint.name}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Backlog Section */}
      <div className="backlog-container glass-panel" id="backlog-panel">
        <div className="backlog-panel-header">
          <div className="backlog-header-left">
            <h2 className="backlog-title">Backlog</h2>
            <span className="badge badge-secondary">{backlogIssues.length} issues</span>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => onOpenCreateIssue()}
          >
            <Plus size={14} />
            <span>Create Issue</span>
          </button>
        </div>

        <div className="backlog-issues-list">
          {backlogIssues.map(issue => (
            <div 
              key={issue.id} 
              className="backlog-issue-row"
              onClick={() => onSelectIssue(issue)}
            >
              <div className="issue-row-left">
                {getTypeIcon(issue.typeCategory)}
                <span className="badge badge-key small">{issue.issueKey}</span>
                <span className="issue-row-title">{issue.title}</span>
              </div>

              <div className="issue-row-right">
                <select
                  className="move-sprint-select"
                  value=""
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => onMoveIssueToSprint(issue.id, e.target.value)}
                >
                  <option value="" disabled>Move to Sprint...</option>
                  {sprints.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                <span 
                  className="issue-status-badge"
                  style={{ backgroundColor: `${issue.statusColorHex}22`, color: issue.statusColorHex }}
                >
                  {issue.statusName}
                </span>

                {issue.storyPoints !== undefined && (
                  <span className="story-points-badge">{issue.storyPoints}</span>
                )}

                {issue.assigneeAvatarUrl ? (
                  <img src={issue.assigneeAvatarUrl} alt="" className="card-avatar small" />
                ) : (
                  <div className="card-avatar small unassigned">?</div>
                )}
              </div>
            </div>
          ))}

          {backlogIssues.length === 0 && (
            <div className="empty-backlog-placeholder">
              <span>Your backlog is empty. Great job!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
