import React, { useState, useRef, useEffect } from 'react';
import { 
  Issue, 
  IssueDetail, 
  ProjectDetail, 
  IssuePriority, 
  Sprint, 
  Attachment, 
  IssueLink, 
  IssueWatcher, 
  IssueLinkType,
  WorkLog,
  WorkflowTransition
} from '../types';
import { storageService } from '../services/storage';
import { api } from '../services/api';
import { useThemeAndLang } from '../stores/themeAndLangStore';
import { 
  X, 
  Trash2, 
  MessageSquare, 
  History, 
  Send,
  Paperclip,
  UploadCloud,
  Download,
  CheckCircle2,
  Circle,
  Plus,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Link2,
  Clock
} from 'lucide-react';

interface IssueModalProps {
  issue: Issue;
  project: ProjectDetail;
  sprints?: Sprint[];
  allIssues?: Issue[];
  workflowTransitions?: WorkflowTransition[];
  onClose: () => void;
  onUpdateIssue: (id: string, updates: Partial<IssueDetail>) => void;
  onDeleteIssue: (id: string) => void;
  onAddComment: (issueId: string, content: string) => void;
  onSelectIssue?: (issue: Issue) => void;
  onRequireResolution?: (issue: Issue, targetStatusId: string, targetStatusName: string) => void;
}

export const IssueModal: React.FC<IssueModalProps> = ({
  issue,
  project,
  sprints = [],
  allIssues = [],
  workflowTransitions = [],
  onClose,
  onUpdateIssue,
  onDeleteIssue,
  onAddComment,
  onSelectIssue,
  onRequireResolution
}) => {
  const { t } = useThemeAndLang();

  const [activeTab, setActiveTab] = useState<'comments' | 'attachments' | 'links' | 'worklogs' | 'activity'>('comments');
  const [newComment, setNewComment] = useState('');
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description || '');
  
  // Subtasks state
  const [subtasks, setSubtasks] = useState<Issue[]>((issue as IssueDetail).subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>((issue as IssueDetail).attachments || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Watchers state
  const [watchers, setWatchers] = useState<IssueWatcher[]>([]);
  const [isWatching, setIsWatching] = useState(false);
  const [showWatchersMenu, setShowWatchersMenu] = useState(false);
  const [isTogglingWatcher, setIsTogglingWatcher] = useState(false);

  // Linked Issues state
  const [links, setLinks] = useState<IssueLink[]>([]);
  const [isLinkingOpen, setIsLinkingOpen] = useState(false);
  const [selectedLinkType, setSelectedLinkType] = useState<IssueLinkType>('RelatesTo');
  const [selectedTargetIssueId, setSelectedTargetIssueId] = useState<string>('');
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  // Work Logs state (Time Tracking)
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [isLoggingWorkOpen, setIsLoggingWorkOpen] = useState(false);
  const [logTimeStr, setLogTimeStr] = useState('1h 30m');
  const [logDescription, setLogDescription] = useState('');
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [originalEstimateHours, setOriginalEstimateHours] = useState<number>(4);

  const parseTimeToMinutes = (val: string): number => {
    let total = 0;
    const hourMatch = val.match(/(\d+(\.\d+)?)\s*h/i);
    const minMatch = val.match(/(\d+)\s*m/i);
    if (hourMatch) total += parseFloat(hourMatch[1]) * 60;
    if (minMatch) total += parseInt(minMatch[1], 10);
    if (!hourMatch && !minMatch) {
      const num = parseInt(val, 10);
      if (!isNaN(num)) total = num;
    }
    return Math.max(1, Math.round(total));
  };

  const formatMinutes = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const totalLoggedMinutes = workLogs.reduce((acc, curr) => acc + curr.timeSpentMinutes, 0);

  const handleCreateWorkLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseTimeToMinutes(logTimeStr);
    setIsSubmittingLog(true);
    try {
      const newLog = await api.createWorkLog(issue.id, {
        timeSpentMinutes: minutes,
        description: logDescription.trim() || undefined
      });
      setWorkLogs(prev => [newLog, ...prev]);
      setLogDescription('');
      setIsLoggingWorkOpen(false);
    } catch (err) {
      console.error('Failed to log work:', err);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const handleDeleteWorkLog = async (logId: string) => {
    try {
      await api.deleteWorkLog(issue.id, logId);
      setWorkLogs(prev => prev.filter(w => w.id !== logId));
    } catch (err) {
      console.error('Failed to delete work log:', err);
    }
  };

  // Load Watchers, Links, and WorkLogs on mount or issue change
  useEffect(() => {
    setTitle(issue.title);
    setDescription(issue.description || '');
    if ((issue as IssueDetail).subtasks) {
      setSubtasks((issue as IssueDetail).subtasks);
    }
    if ((issue as IssueDetail).attachments) {
      setAttachments((issue as IssueDetail).attachments);
    }

    async function loadWatchersAndLinks() {
      try {
        const [loadedWatchers, loadedLinks, loadedWorkLogs] = await Promise.all([
          api.getIssueWatchers(issue.id),
          api.getIssueLinks(issue.id),
          api.getWorkLogs(issue.id)
        ]);
        setWatchers(loadedWatchers);
        // Current user check (Alex Developer demo user)
        const isUserWatching = loadedWatchers.some(w => w.userId === '11111111-1111-1111-1111-111111111111');
        setIsWatching(isUserWatching);
        setLinks(loadedLinks);
        setWorkLogs(loadedWorkLogs);
      } catch (err) {
        console.error('Failed to load watchers, links, or work logs:', err);
      }
    }

    loadWatchersAndLinks();
  }, [issue]);

  // Inline Title & Description Handlers
  const handleTitleBlur = () => {
    if (title.trim() && title !== issue.title) {
      onUpdateIssue(issue.id, { title: title.trim() });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleDescBlur = () => {
    if (description !== (issue.description || '')) {
      onUpdateIssue(issue.id, { description: description.trim() });
    }
  };

  // Comments Handler
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    onAddComment(issue.id, newComment.trim());
    setNewComment('');
  };

  // Watcher Toggle Handler
  const handleToggleWatcher = async () => {
    if (isTogglingWatcher) return;
    setIsTogglingWatcher(true);
    try {
      const nextWatching = await api.toggleIssueWatcher(issue.id);
      setIsWatching(nextWatching);
      const updatedWatchers = await api.getIssueWatchers(issue.id);
      setWatchers(updatedWatchers);
    } catch (err) {
      console.error('Failed to toggle watcher:', err);
    } finally {
      setIsTogglingWatcher(false);
    }
  };

  // Subtask Handlers
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || isAddingSubtask) return;

    setIsAddingSubtask(true);
    try {
      const subtaskType = project.issueTypes.find(t => t.category === 'Subtask') || 
                          project.issueTypes.find(t => t.isSubtask) || 
                          project.issueTypes[project.issueTypes.length - 1];
      const defaultStatus = project.issueStatuses[0];

      const newSub = await api.createIssue({
        projectId: project.id,
        title: newSubtaskTitle.trim(),
        typeId: subtaskType.id,
        statusId: defaultStatus.id,
        parentId: issue.id,
        priority: 'Medium'
      });

      const updated = [...subtasks, newSub];
      setSubtasks(updated);
      setNewSubtaskTitle('');
      onUpdateIssue(issue.id, { subtasks: updated, subtaskCount: updated.length });
    } catch (err: any) {
      console.error('Failed to create subtask:', err);
    } finally {
      setIsAddingSubtask(false);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, currentCompleted: boolean) => {
    const doneStatus = project.issueStatuses.find(s => s.isCompletedStatus) || 
                       project.issueStatuses[project.issueStatuses.length - 1];
    const todoStatus = project.issueStatuses.find(s => !s.isCompletedStatus) || 
                       project.issueStatuses[0];

    const targetStatus = currentCompleted ? todoStatus : doneStatus;
    const targetCompleted = !currentCompleted;

    const updated = subtasks.map(s => {
      if (s.id === subtaskId) {
        return {
          ...s,
          statusId: targetStatus.id,
          statusName: targetStatus.name,
          statusColorHex: targetStatus.colorHex,
          isCompletedStatus: targetCompleted
        };
      }
      return s;
    });
    setSubtasks(updated);
    onUpdateIssue(issue.id, { subtasks: updated });

    try {
      await api.updateIssue(subtaskId, {
        statusId: targetStatus.id,
        statusName: targetStatus.name,
        statusColorHex: targetStatus.colorHex,
        isCompletedStatus: targetCompleted
      });
    } catch (err) {
      console.error('Failed to update subtask status:', err);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const updated = subtasks.filter(s => s.id !== subtaskId);
    setSubtasks(updated);
    onUpdateIssue(issue.id, { subtasks: updated, subtaskCount: updated.length });

    try {
      await api.deleteIssue(subtaskId);
    } catch (err) {
      console.error('Failed to delete subtask:', err);
    }
  };

  // Attachment Upload Handlers
  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = storageService.validateFile(file);
        if (!validation.valid) {
          setUploadError(validation.error || 'Invalid file.');
          continue;
        }

        const uploadRes = await storageService.uploadAttachment(file, project.id, issue.id);
        const newAtt = await api.createAttachment(issue.id, {
          fileName: uploadRes.fileName,
          filePath: uploadRes.filePath,
          fileSizeBytes: uploadRes.fileSizeBytes,
          contentType: uploadRes.contentType,
          downloadUrl: uploadRes.downloadUrl
        });

        setAttachments(prev => {
          const next = [...prev, newAtt];
          onUpdateIssue(issue.id, { attachments: next, attachmentCount: next.length });
          return next;
        });
      }
    } catch (err: any) {
      setUploadError(err.message || 'Attachment upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!window.confirm('Are you sure you want to remove this attachment?')) return;

    const next = attachments.filter(a => a.id !== attachmentId);
    setAttachments(next);
    onUpdateIssue(issue.id, { attachments: next, attachmentCount: next.length });

    try {
      await api.deleteAttachment(issue.id, attachmentId);
    } catch (err) {
      console.error('Failed to delete attachment:', err);
    }
  };

  // Linked Issues Handlers
  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetIssueId || isCreatingLink) return;

    setIsCreatingLink(true);
    try {
      const newLink = await api.createIssueLink(issue.id, {
        targetIssueId: selectedTargetIssueId,
        linkType: selectedLinkType
      });
      if (newLink) {
        setLinks(prev => [...prev, newLink]);
        setSelectedTargetIssueId('');
        setIsLinkingOpen(false);
      }
    } catch (err) {
      console.error('Failed to link issue:', err);
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    const next = links.filter(l => l.id !== linkId);
    setLinks(next);
    try {
      await api.deleteIssueLink(issue.id, linkId);
    } catch (err) {
      console.error('Failed to delete link:', err);
    }
  };

  // Formatters
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (contentType: string, fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (contentType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) {
      return <ImageIcon size={18} className="file-icon-img" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet size={18} className="file-icon-sheet" />;
    }
    if (['zip', 'rar', 'tar', 'gz'].includes(ext || '')) {
      return <FileArchive size={18} className="file-icon-archive" />;
    }
    if (['json', 'js', 'ts', 'html', 'css'].includes(ext || '')) {
      return <FileCode size={18} className="file-icon-code" />;
    }
    return <FileText size={18} className="file-icon-doc" />;
  };

  const getRelationshipBadgeClass = (type: IssueLinkType): string => {
    switch (type) {
      case 'Blocks': return 'link-badge-blocks';
      case 'IsBlockedBy': return 'link-badge-blocked';
      case 'Duplicates': return 'link-badge-dup';
      default: return 'link-badge-relates';
    }
  };

  const comments = (issue as IssueDetail).comments || [];
  const activityLogs = (issue as IssueDetail).activityLogs || [];

  // Calculate Subtask Progress
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter(s => s.isCompletedStatus).length;
  const subtaskProgressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const isSubtask = issue.typeCategory === 'Subtask';
  const availableTargetIssues = allIssues.filter(i => i.id !== issue.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content issue-modal-container glass-panel" 
        onClick={(e) => e.stopPropagation()}
        id={`issue-modal-${issue.issueKey}`}
      >
        {/* Header */}
        <div className="issue-modal-header">
          <div className="modal-header-left">
            <span className="badge badge-key">{issue.issueKey}</span>
            <span className="modal-issue-type">{issue.typeName}</span>
            {issue.sprintName && (
              <span className="badge badge-secondary" title="Current Sprint">
                {issue.sprintName}
              </span>
            )}
          </div>

          <div className="modal-header-right">
            {/* Watchers Button with Popover */}
            <div className="watchers-wrapper">
              <button
                type="button"
                className={`watcher-btn ${isWatching ? 'is-watching' : ''}`}
                onClick={handleToggleWatcher}
                title={isWatching ? 'Click to stop watching' : 'Click to watch issue'}
                disabled={isTogglingWatcher}
              >
                {isWatching ? <Eye size={15} /> : <EyeOff size={15} />}
                <span>{isWatching ? t('watching') : t('watch')}</span>
                <span 
                  className="watchers-count-pill"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowWatchersMenu(!showWatchersMenu);
                  }}
                  title="View watchers list"
                >
                  {watchers.length}
                </span>
              </button>

              {showWatchersMenu && (
                <div className="watchers-popover glass-panel">
                  <div className="watchers-popover-header">
                    <span>Watchers ({watchers.length})</span>
                    <button 
                      className="icon-btn-subtle" 
                      onClick={() => setShowWatchersMenu(false)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="watchers-popover-list">
                    {watchers.map(w => (
                      <div key={w.userId} className="watcher-row">
                        <img 
                          src={w.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${w.fullName}`} 
                          alt="" 
                          className="card-avatar small" 
                        />
                        <div className="watcher-info">
                          <span className="watcher-name">{w.fullName}</span>
                          <span className="watcher-email">{w.email}</span>
                        </div>
                      </div>
                    ))}
                    {watchers.length === 0 && (
                      <div className="empty-watchers-text">No watchers yet.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              className="icon-btn-danger" 
              onClick={() => {
                if (window.confirm(`${t('deleteConfirm')} (${issue.issueKey})`)) {
                  onDeleteIssue(issue.id);
                  onClose();
                }
              }}
              title="Delete Issue"
            >
              <Trash2 size={16} />
            </button>
            <button className="icon-btn" onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body Grid */}
        <div className="issue-modal-body">
          {/* Main Content Area */}
          <div className="issue-main-area">
            {/* Title Input */}
            <div className="form-group">
              <input
                type="text"
                className="issue-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                placeholder="Issue title"
              />
            </div>

            {/* Description Textarea */}
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="issue-desc-textarea"
                rows={3}
                placeholder="Add a detailed description, reproduction steps, or acceptance criteria..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescBlur}
              />
            </div>

            {/* Subtasks Section (Only shown if current issue is not itself a subtask) */}
            {!isSubtask && (
              <div className="subtasks-section" id="issue-subtasks-section">
                <div className="subtasks-header">
                  <div className="subtasks-title-progress">
                    <h3 className="section-heading">{t('subtasks')}</h3>
                    {totalSubtasks > 0 && (
                      <span className="subtasks-progress-text">
                        {completedSubtasks} of {totalSubtasks} {t('completed')} ({subtaskProgressPercent}%)
                      </span>
                    )}
                  </div>
                  {totalSubtasks > 0 && (
                    <div className="subtask-progress-bar-bg">
                      <div 
                        className="subtask-progress-bar-fill" 
                        style={{ width: `${subtaskProgressPercent}%` }} 
                      />
                    </div>
                  )}
                </div>

                {/* Subtask items list */}
                <div className="subtasks-list">
                  {subtasks.map(sub => (
                    <div 
                      key={sub.id} 
                      className={`subtask-item ${sub.isCompletedStatus ? 'subtask-completed' : ''}`}
                    >
                      <button
                        type="button"
                        className="subtask-toggle-btn"
                        onClick={() => handleToggleSubtask(sub.id, sub.isCompletedStatus)}
                        title={sub.isCompletedStatus ? 'Mark Incomplete' : 'Mark Complete'}
                      >
                        {sub.isCompletedStatus ? (
                          <CheckCircle2 size={16} className="text-success" />
                        ) : (
                          <Circle size={16} className="text-muted" />
                        )}
                      </button>

                      <span className="badge badge-key small">{sub.issueKey}</span>
                      
                      <span className="subtask-title-text">{sub.title}</span>

                      <div className="subtask-actions">
                        <span 
                          className="subtask-status-pill"
                          style={{ 
                            backgroundColor: `${sub.statusColorHex}22`, 
                            color: sub.statusColorHex,
                            borderColor: `${sub.statusColorHex}44` 
                          }}
                        >
                          {sub.statusName}
                        </span>

                        {sub.assigneeAvatarUrl ? (
                          <img 
                            src={sub.assigneeAvatarUrl} 
                            alt="" 
                            className="card-avatar small" 
                            title={sub.assigneeName} 
                          />
                        ) : (
                          <div className="card-avatar small unassigned">?</div>
                        )}

                        <button
                          type="button"
                          className="subtask-delete-btn"
                          onClick={() => handleDeleteSubtask(sub.id)}
                          title="Remove sub-task"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Subtask Quick Input */}
                <form className="add-subtask-form" onSubmit={handleAddSubtask}>
                  <input
                    type="text"
                    className="add-subtask-input"
                    placeholder={t('addSubtask')}
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    disabled={isAddingSubtask}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-secondary btn-sm"
                    disabled={!newSubtaskTitle.trim() || isAddingSubtask}
                  >
                    {isAddingSubtask ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    <span>Add</span>
                  </button>
                </form>
              </div>
            )}

            {/* Linked Issues Section */}
            <div className="linked-issues-section" id="issue-linked-section">
              <div className="linked-issues-header">
                <div className="linked-title-group">
                  <Link2 size={15} className="text-primary" />
                  <h3 className="section-heading">{t('linkedIssues')} ({links.length})</h3>
                </div>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => setIsLinkingOpen(!isLinkingOpen)}
                >
                  <Plus size={13} />
                  <span>{t('linkIssue')}</span>
                </button>
              </div>

              {/* Add Link Form */}
              {isLinkingOpen && (
                <form className="add-link-form glass-panel" onSubmit={handleCreateLink}>
                  <div className="link-form-inputs">
                    <select
                      className="link-type-select"
                      value={selectedLinkType}
                      onChange={(e) => setSelectedLinkType(e.target.value as IssueLinkType)}
                    >
                      <option value="RelatesTo">{t('relatesTo')}</option>
                      <option value="Blocks">{t('blocks')}</option>
                      <option value="IsBlockedBy">{t('isBlockedBy')}</option>
                      <option value="Duplicates">{t('duplicates')}</option>
                    </select>

                    <select
                      className="link-target-select"
                      value={selectedTargetIssueId}
                      onChange={(e) => setSelectedTargetIssueId(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select target issue...</option>
                      {availableTargetIssues.map(ti => (
                        <option key={ti.id} value={ti.id}>
                          {ti.issueKey} — {ti.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="link-form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsLinkingOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={!selectedTargetIssueId || isCreatingLink}
                    >
                      {isCreatingLink ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
                      <span>Link</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Linked Issues List */}
              <div className="linked-issues-list">
                {links.map(link => {
                  const isCurrentSource = link.sourceIssueId === issue.id;
                  const targetKey = isCurrentSource ? link.targetIssueKey : link.sourceIssueKey;
                  const targetTitle = isCurrentSource ? link.targetTitle : link.sourceTitle;
                  const targetId = isCurrentSource ? link.targetIssueId : link.sourceIssueId;

                  return (
                    <div key={link.id} className="linked-issue-item">
                      <span className={`link-relation-badge ${getRelationshipBadgeClass(link.linkType)}`}>
                        {link.relationshipText || link.linkType}
                      </span>

                      <button
                        type="button"
                        className="linked-issue-key-btn badge badge-key small"
                        onClick={() => {
                          const targetObj = allIssues.find(i => i.id === targetId);
                          if (targetObj && onSelectIssue) {
                            onSelectIssue(targetObj);
                          }
                        }}
                        title={`Open ${targetKey}`}
                      >
                        {targetKey}
                      </button>

                      <span className="linked-issue-title" title={targetTitle}>
                        {targetTitle}
                      </span>

                      <span 
                        className="subtask-status-pill"
                        style={{ 
                          backgroundColor: `${link.targetStatusColorHex || '#38bdf8'}22`, 
                          color: link.targetStatusColorHex || '#38bdf8',
                          borderColor: `${link.targetStatusColorHex || '#38bdf8'}44` 
                        }}
                      >
                        {link.targetStatusName || 'Status'}
                      </span>

                      <button
                        type="button"
                        className="subtask-delete-btn"
                        onClick={() => handleDeleteLink(link.id)}
                        title="Remove link"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}

                {links.length === 0 && !isLinkingOpen && (
                  <div className="empty-links-hint">
                    <span>No linked issues. Connect dependencies or related tasks above.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs for Comments, Attachments, and Activity */}
            <div className="issue-tabs-section">
              <div className="tabs-header">
                <button
                  className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('comments')}
                >
                  <MessageSquare size={14} />
                  <span>{t('comments')} ({comments.length})</span>
                </button>
                <button
                  className={`tab-btn ${activeTab === 'attachments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('attachments')}
                >
                  <Paperclip size={14} />
                  <span>{t('attachments')} ({attachments.length})</span>
                </button>
                <button
                  className={`tab-btn ${activeTab === 'worklogs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('worklogs')}
                >
                  <Clock size={14} />
                  <span>{t('workLogs')} ({workLogs.length})</span>
                </button>
                <button
                  className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
                  onClick={() => setActiveTab('activity')}
                >
                  <History size={14} />
                  <span>{t('activity')} ({activityLogs.length})</span>
                </button>
              </div>

              {/* Comments Tab Pane */}
              {activeTab === 'comments' && (
                <div className="comments-pane">
                  <div className="comments-list">
                    {comments.map(c => (
                      <div key={c.id} className="comment-item">
                        <img 
                          src={c.userAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userName}`} 
                          alt="" 
                          className="comment-avatar" 
                        />
                        <div className="comment-bubble">
                          <div className="comment-top">
                            <span className="comment-author">{c.userName}</span>
                            <span className="comment-time">
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="comment-text">{c.content}</div>
                        </div>
                      </div>
                    ))}

                    {comments.length === 0 && (
                      <div className="empty-comments">{t('noComments')}</div>
                    )}
                  </div>

                  {/* Add Comment Form */}
                  <form className="add-comment-box" onSubmit={handleCommentSubmit}>
                    <input
                      type="text"
                      placeholder={t('addCommentPlaceholder')}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary btn-sm">
                      <Send size={14} />
                      <span>{t('post')}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Attachments Tab Pane */}
              {activeTab === 'attachments' && (
                <div className="attachments-pane" id="issue-attachments-pane">
                  {/* File Upload Dropzone */}
                  <div 
                    className={`attachment-dropzone ${isDragOver ? 'dropzone-active' : ''} ${isUploading ? 'dropzone-uploading' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      handleUploadFiles(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden-file-input"
                      onChange={(e) => handleUploadFiles(e.target.files)}
                      style={{ display: 'none' }}
                    />
                    {isUploading ? (
                      <div className="dropzone-status">
                        <Loader2 size={24} className="animate-spin text-primary" />
                        <span className="dropzone-text">Uploading to Supabase Storage...</span>
                      </div>
                    ) : (
                      <div className="dropzone-status">
                        <UploadCloud size={24} className="dropzone-icon" />
                        <div className="dropzone-instructions">
                          <span className="dropzone-primary-text">{t('dropFiles')}</span>
                          <span className="dropzone-sub-text">{t('dropFilesHint')}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {uploadError && (
                    <div className="upload-error-banner">
                      <AlertCircle size={14} />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {/* Attachments List */}
                  <div className="attachments-grid">
                    {attachments.map(att => {
                      const isImage = att.contentType?.startsWith('image/') || 
                                      ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].some(ext => att.fileName.toLowerCase().endsWith(ext));

                      return (
                        <div key={att.id} className="attachment-card glass-panel">
                          {isImage ? (
                            <div className="attachment-preview-img-box">
                              <img 
                                src={att.downloadUrl || att.filePath} 
                                alt={att.fileName} 
                                className="attachment-thumb"
                                loading="lazy" 
                              />
                            </div>
                          ) : (
                            <div className="attachment-file-icon-box">
                              {getFileIcon(att.contentType, att.fileName)}
                            </div>
                          )}

                          <div className="attachment-meta">
                            <span className="attachment-name" title={att.fileName}>
                              {att.fileName}
                            </span>
                            <div className="attachment-sub-meta">
                              <span className="attachment-size">{formatFileSize(att.fileSizeBytes)}</span>
                              <span className="attachment-author">• {att.userName}</span>
                            </div>
                          </div>

                          <div className="attachment-card-actions">
                            {att.downloadUrl && (
                              <a
                                href={att.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="icon-btn-subtle"
                                title="Download / Open file"
                                download={att.fileName}
                              >
                                <Download size={14} />
                              </a>
                            )}
                            <button
                              type="button"
                              className="icon-btn-danger"
                              onClick={() => handleDeleteAttachment(att.id)}
                              title="Delete attachment"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {attachments.length === 0 && !isUploading && (
                      <div className="empty-attachments-hint">
                        <span>No files attached yet. Drop files above or click to browse.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Work Logs Tab Pane (Time Tracking) */}
              {activeTab === 'worklogs' && (
                <div className="worklogs-pane" id="issue-worklogs-pane" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginRight: '6px' }}>{t('timeSpent')}:</span>
                      <strong style={{ fontSize: '16px', color: '#10b981' }}>{formatMinutes(totalLoggedMinutes)}</strong>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsLoggingWorkOpen(!isLoggingWorkOpen)}
                    >
                      <Plus size={14} />
                      <span>{t('logWork')}</span>
                    </button>
                  </div>

                  {isLoggingWorkOpen && (
                    <form onSubmit={handleCreateWorkLog} className="glass-panel" style={{ padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                          {t('timeSpent')} <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="meta-input"
                          placeholder="Ví dụ: 1h 30m, 45m, 2h"
                          value={logTimeStr}
                          onChange={(e) => setLogTimeStr(e.target.value)}
                          required
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cú pháp hỗ trợ: 1h, 30m, 1h 30m</span>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                          Mô tả công việc thực hiện
                        </label>
                        <textarea
                          className="meta-input"
                          rows={2}
                          placeholder="Mô tả tóm tắt những gì bạn đã làm..."
                          value={logDescription}
                          onChange={(e) => setLogDescription(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setIsLoggingWorkOpen(false)}
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                          disabled={isSubmittingLog || !logTimeStr.trim()}
                        >
                          {isSubmittingLog ? <Loader2 size={13} className="animate-spin" /> : <Clock size={13} />}
                          <span>Lưu thời gian</span>
                        </button>
                      </div>
                    </form>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {workLogs.map(log => (
                      <div
                        key={log.id}
                        className="glass-panel"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={log.userAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.userName}`}
                            alt=""
                            className="card-avatar small"
                            title={log.userName}
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '600', fontSize: '13px' }}>{log.userName}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {log.description ? (
                              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{log.description}</p>
                            ) : (
                              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Không có mô tả</p>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '12px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              fontWeight: '700',
                              fontSize: '12px',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            {formatMinutes(log.timeSpentMinutes)}
                          </span>
                          <button
                            type="button"
                            className="subtask-delete-btn"
                            onClick={() => handleDeleteWorkLog(log.id)}
                            title="Xóa nhật ký này"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {workLogs.length === 0 && !isLoggingWorkOpen && (
                      <div className="empty-comments">
                        Chưa có thời gian nào được ghi. Nhấn "+ Ghi Thời Gian" để bắt đầu theo dõi.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Activity History Tab Pane */}
              {activeTab === 'activity' && (
                <div className="activity-pane">
                  <div className="activity-list">
                    {activityLogs.map(a => (
                      <div key={a.id} className="activity-item">
                        <span className="activity-dot" />
                        <div className="activity-info">
                          <span className="activity-user">{a.userName}</span>
                          <span className="activity-action"> {a.activityType.toLowerCase()} </span>
                          {a.fieldName && <span className="activity-field">{a.fieldName}: </span>}
                          {a.newValue && <span className="activity-val">{a.newValue}</span>}
                          <span className="activity-date"> ({new Date(a.createdAt).toLocaleDateString()})</span>
                        </div>
                      </div>
                    ))}
                    {activityLogs.length === 0 && (
                      <div className="empty-comments">No activity records found.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Meta Sidebar */}
          <div className="issue-meta-sidebar">
            {/* Status Select */}
            <div className="meta-field">
              <label className="meta-field-label">{t('status')}</label>
              <select
                value={issue.statusId}
                onChange={(e) => {
                  const s = project.issueStatuses.find(st => st.id === e.target.value);
                  if (!s) return;
                  if (s.isCompletedStatus && onRequireResolution) {
                    onRequireResolution(issue, s.id, s.name);
                  } else {
                    onUpdateIssue(issue.id, { 
                      statusId: s.id,
                      statusName: s.name,
                      statusColorHex: s.colorHex,
                      isCompletedStatus: s.isCompletedStatus
                    });
                  }
                }}
                className="meta-select"
              >
                {project.issueStatuses.map(s => {
                  const isCurrent = s.id === issue.statusId;
                  const isAllowed = !workflowTransitions || workflowTransitions.length === 0 || isCurrent ||
                    workflowTransitions.some(t => t.fromStatusId === issue.statusId && t.toStatusId === s.id);
                  return (
                    <option key={s.id} value={s.id} disabled={!isAllowed}>
                      {s.name} {!isAllowed ? '🔒 (Chặn)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Time Tracking Progress & Estimate */}
            <div className="meta-field time-tracking-meta-field" style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="meta-field-label" style={{ margin: 0 }}>{t('timeTracking')}</label>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#10b981' }}>
                  {formatMinutes(totalLoggedMinutes)} / {originalEstimateHours}h
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, originalEstimateHours > 0 ? (totalLoggedMinutes / (originalEstimateHours * 60)) * 100 : 0)}%`,
                    backgroundColor: totalLoggedMinutes > originalEstimateHours * 60 ? '#ef4444' : '#10b981',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('originalEstimate')}:</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={originalEstimateHours}
                  onChange={(e) => setOriginalEstimateHours(parseFloat(e.target.value) || 0)}
                  className="meta-input"
                  style={{ width: '60px', padding: '3px 6px', fontSize: '12px' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>giờ</span>
              </div>
            </div>

            {/* Assignee Select */}
            <div className="meta-field">
              <label className="meta-field-label">{t('assignee')}</label>
              <select
                value={issue.assigneeId || ''}
                onChange={(e) => {
                  const m = project.members.find(mem => mem.userId === e.target.value);
                  onUpdateIssue(issue.id, {
                    assigneeId: e.target.value || undefined,
                    assigneeName: m?.fullName,
                    assigneeAvatarUrl: m?.avatarUrl
                  });
                }}
                className="meta-select"
              >
                <option value="">{t('unassigned')}</option>
                {project.members.map(m => (
                  <option key={m.userId} value={m.userId}>{m.fullName}</option>
                ))}
              </select>
            </div>

            {/* Priority Select */}
            <div className="meta-field">
              <label className="meta-field-label">{t('priority')}</label>
              <select
                value={issue.priority}
                onChange={(e) => onUpdateIssue(issue.id, { priority: e.target.value as IssuePriority })}
                className="meta-select"
              >
                <option value="Urgent">🔴 Urgent</option>
                <option value="High">🟠 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🔵 Low</option>
                <option value="Lowest">⚪ Lowest</option>
              </select>
            </div>

            {/* Sprint Select */}
            <div className="meta-field">
              <label className="meta-field-label">{t('sprint')}</label>
              <select
                value={issue.sprintId || ''}
                onChange={(e) => {
                  const sId = e.target.value || undefined;
                  const sp = sprints.find(s => s.id === sId);
                  onUpdateIssue(issue.id, {
                    sprintId: sId,
                    sprintName: sp?.name
                  });
                }}
                className="meta-select"
              >
                <option value="">Backlog (No Sprint)</option>
                {sprints.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                ))}
              </select>
            </div>

            {/* Story Points */}
            <div className="meta-field">
              <label className="meta-field-label">{t('storyPoints')}</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={issue.storyPoints ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? parseFloat(e.target.value) : undefined;
                  onUpdateIssue(issue.id, { storyPoints: val });
                }}
                className="meta-input"
                placeholder="0, 1, 2, 3, 5, 8..."
              />
            </div>

            {/* Reporter Meta */}
            <div className="meta-field meta-info-row">
              <span className="meta-field-label">{t('reporter')}</span>
              <span className="meta-info-val">{issue.reporterName}</span>
            </div>

            {/* Timestamps */}
            <div className="meta-field meta-info-row">
              <span className="meta-field-label">{t('created')}</span>
              <span className="meta-info-val">{new Date(issue.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="meta-field meta-info-row">
              <span className="meta-field-label">{t('updated')}</span>
              <span className="meta-info-val">{new Date(issue.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
