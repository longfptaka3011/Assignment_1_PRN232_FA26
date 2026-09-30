import React, { useState } from 'react';
import { ProjectDetail, ProjectRole } from '../types';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Tag, 
  FolderKanban, 
  Check, 
  Mail
} from 'lucide-react';

interface ProjectSettingsViewProps {
  project: ProjectDetail;
  onAddMember: (email: string, role: ProjectRole) => void;
}

export const ProjectSettingsView: React.FC<ProjectSettingsViewProps> = ({
  project,
  onAddMember
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectRole>('Member');
  const [invitedSuccess, setInvitedSuccess] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    onAddMember(inviteEmail.trim(), inviteRole);
    setInviteEmail('');
    setInvitedSuccess(true);
    setTimeout(() => setInvitedSuccess(false), 3000);
  };

  return (
    <div className="settings-view-container" id="project-settings-view">
      <div className="board-header">
        <div>
          <h1 className="board-title">Team & Project Settings</h1>
          <p className="board-subtitle">Manage project access, member permissions, workflows, and issue classifications.</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Left Column: Team Members */}
        <div className="settings-card glass-panel">
          <div className="settings-card-header">
            <div className="card-header-icon-title">
              <Users size={18} className="header-icon" />
              <h2 className="card-header-title">Team Members ({project.members.length})</h2>
            </div>
          </div>

          {/* Invite Form */}
          <form className="invite-member-form" onSubmit={handleInvite}>
            <div className="invite-inputs-row">
              <div className="invite-input-wrap">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  placeholder="collaborator@taskflow.dev"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <select 
                value={inviteRole} 
                onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
                className="role-select"
              >
                <option value="Admin">Admin</option>
                <option value="Member">Member</option>
                <option value="Viewer">Viewer</option>
              </select>

              <button type="submit" className="btn btn-primary invite-btn">
                <UserPlus size={16} />
                <span>Invite</span>
              </button>
            </div>

            {invitedSuccess && (
              <div className="invite-success-msg">
                <Check size={14} /> Member invited and added to project!
              </div>
            )}
          </form>

          {/* Members Table */}
          <div className="members-table-wrap">
            <table className="members-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {project.members.map(member => (
                  <tr key={member.id}>
                    <td>
                      <div className="member-cell">
                        <img 
                          src={member.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.fullName}`} 
                          alt="" 
                          className="member-avatar" 
                        />
                        <div className="member-text">
                          <span className="member-name">{member.fullName}</span>
                          <span className="member-email">{member.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-role-${member.role.toLowerCase()}`}>
                        {member.role}
                      </span>
                    </td>
                    <td>
                      <span className="joined-date">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Project General & Workflows */}
        <div className="settings-sidebar-col">
          {/* Project Details */}
          <div className="settings-card glass-panel">
            <div className="settings-card-header">
              <div className="card-header-icon-title">
                <FolderKanban size={18} className="header-icon" />
                <h2 className="card-header-title">Project Overview</h2>
              </div>
            </div>

            <div className="project-overview-content">
              <div className="overview-item">
                <span className="overview-label">Project Name</span>
                <span className="overview-value">{project.name}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Key Prefix</span>
                <span className="badge badge-key">{project.key}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Project Lead</span>
                <span className="overview-value">{project.leadName}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Description</span>
                <p className="overview-desc">{project.description || 'No description provided.'}</p>
              </div>
            </div>
          </div>

          {/* Workflow Statuses */}
          <div className="settings-card glass-panel">
            <div className="settings-card-header">
              <div className="card-header-icon-title">
                <ShieldCheck size={18} className="header-icon" />
                <h2 className="card-header-title">Kanban Columns ({project.issueStatuses.length})</h2>
              </div>
            </div>

            <div className="statuses-list-summary">
              {project.issueStatuses.map(status => (
                <div key={status.id} className="status-summary-row">
                  <span className="status-color-dot" style={{ backgroundColor: status.colorHex }} />
                  <span className="status-summary-name">{status.name}</span>
                  {status.isCompletedStatus && (
                    <span className="badge badge-completed small">Done State</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Project Labels */}
          <div className="settings-card glass-panel">
            <div className="settings-card-header">
              <div className="card-header-icon-title">
                <Tag size={18} className="header-icon" />
                <h2 className="card-header-title">Labels ({project.labels.length})</h2>
              </div>
            </div>

            <div className="labels-cloud">
              {project.labels.map(l => (
                <span 
                  key={l.id} 
                  className="card-label-chip large"
                  style={{ 
                    backgroundColor: `${l.colorHex}22`,
                    color: l.colorHex,
                    borderColor: `${l.colorHex}44` 
                  }}
                >
                  {l.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
