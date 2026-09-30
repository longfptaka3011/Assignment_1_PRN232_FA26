import React, { useState, useEffect } from 'react';
import { Project, ProjectDetail, Issue, IssueDetail, Sprint, Notification, ProjectRole, IssuePriority, WorkflowTransition } from '../types';
import { api } from '../services/api';
import { realtimeService } from '../services/realtime';
import { useAuthStore } from '../stores/authStore';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { KanbanBoard } from './KanbanBoard';
import { BacklogView } from './BacklogView';
import { ProjectSettingsView } from './ProjectSettingsView';
import { AgileReportsView } from './AgileReportsView';
import { CsvImportExportModal } from './CsvImportExportModal';
import { ResolutionModal } from './ResolutionModal';
import { IssueModal } from './IssueModal';
import { CreateIssueModal } from './CreateIssueModal';
import { CreateSprintModal } from './CreateSprintModal';
import { Radio } from 'lucide-react';

export function Workspace() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectDetail | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [workflowTransitions, setWorkflowTransitions] = useState<WorkflowTransition[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveToast, setLiveToast] = useState<string | null>(null);

  // View & Filter States
  const [currentView, setCurrentView] = useState<'board' | 'backlog' | 'reports' | 'settings'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssigneeId, setFilterAssigneeId] = useState<string | null>(null);

  // Modals
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [createIssueInitialStatusId, setCreateIssueInitialStatusId] = useState<string | undefined>();
  const [createIssueInitialSprintId, setCreateIssueInitialSprintId] = useState<string | undefined>();
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resolutionModalData, setResolutionModalData] = useState<{
    issue: Issue;
    targetStatusId: string;
    targetStatusName: string;
  } | null>(null);

  // Initial Load
  const loadInitialData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const projs = await api.getProjects();
      setProjects(projs);

      if (projs.length > 0) {
        const detail = await api.getProjectByKey(projs[0].key);
        setCurrentProject(detail);

        const [sprintList, issueList, notifList, transitions] = await Promise.all([
          api.getSprints(detail.id),
          api.getIssues(detail.id),
          api.getNotifications(),
          api.getWorkflowTransitions(detail.id)
        ]);

        setSprints(sprintList);
        setIssues(issueList);
        setNotifications(notifList);
        setWorkflowTransitions(transitions);
      } else {
        setLoadError('Không tìm thấy dự án nào trong hệ thống. Đang tải lại...');
      }
    } catch (err: any) {
      console.error('Failed to load TaskFlow data:', err);
      setLoadError(err.message || 'Không thể kết nối máy chủ API (Render có thể đang khởi động từ chế độ ngủ). Vui lòng thử lại sau giây lát.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Realtime WebSocket Subscription
  useEffect(() => {
    if (!currentProject) return;

    const unsubscribeIssues = realtimeService.subscribeToProjectIssues(currentProject.id, {
      onInsert: (newIssueData) => {
        setIssues(prev => {
          if (prev.some(i => i.id === newIssueData.id)) return prev;
          const full = newIssueData as Issue;
          setLiveToast(`Realtime: Issue ${full.issueKey || 'created'} added.`);
          return [...prev, full];
        });
      },
      onUpdate: (updatedIssueData) => {
        setIssues(prev => prev.map(i => {
          if (i.id === updatedIssueData.id) {
            setLiveToast(`Realtime: Issue ${i.issueKey} updated.`);
            return { ...i, ...updatedIssueData };
          }
          return i;
        }));
      },
      onDelete: (deletedIssueId) => {
        setIssues(prev => prev.filter(i => i.id !== deletedIssueId));
        setLiveToast('Realtime: Issue removed.');
      }
    });

    const currentUserId = useAuthStore.getState().user?.id || '11111111-1111-1111-1111-111111111111';
    const unsubscribeNotifs = realtimeService.subscribeToUserNotifications(currentUserId, (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      setLiveToast(`Notification: ${newNotif.title}`);
    });

    return () => {
      unsubscribeIssues();
      unsubscribeNotifs();
    };
  }, [currentProject]);

  // Toast Auto-Dismiss
  useEffect(() => {
    if (liveToast) {
      const timer = setTimeout(() => setLiveToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [liveToast]);

  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleSelectIssueByKey = (key: string) => {
    const cleanKey = key.replace(/^\/issues\//, '');
    const found = issues.find(i => i.issueKey === cleanKey);
    if (found) {
      setSelectedIssue(found);
    }
  };

  // Handle Project Change
  const handleSelectProject = async (p: Project) => {
    setLoading(true);
    try {
      const detail = await api.getProjectByKey(p.key);
      setCurrentProject(detail);

      const [sprintList, issueList, transitions] = await Promise.all([
        api.getSprints(detail.id),
        api.getIssues(detail.id),
        api.getWorkflowTransitions(detail.id)
      ]);

      setSprints(sprintList);
      setIssues(issueList);
      setWorkflowTransitions(transitions);
    } finally {
      setLoading(false);
    }
  };

  // Issue Handlers
  const handleMoveIssue = async (issueId: string, newStatusId: string) => {
    // Optimistic UI update
    setIssues(prev => prev.map(issue => {
      if (issue.id === issueId) {
        const st = currentProject?.issueStatuses.find(s => s.id === newStatusId);
        return {
          ...issue,
          statusId: newStatusId,
          statusName: st?.name || issue.statusName,
          statusColorHex: st?.colorHex || issue.statusColorHex,
          isCompletedStatus: st?.isCompletedStatus || false
        };
      }
      return issue;
    }));

    await api.moveIssue(issueId, { targetStatusId: newStatusId });
  };

  const handleMoveIssueToSprint = async (issueId: string, sprintId: string | null) => {
    setIssues(prev => prev.map(issue => {
      if (issue.id === issueId) {
        const sp = sprints.find(s => s.id === sprintId);
        return {
          ...issue,
          sprintId: sprintId || undefined,
          sprintName: sp?.name
        };
      }
      return issue;
    }));

    await api.moveIssue(issueId, { 
      targetSprintId: sprintId || undefined, 
      updateSprint: true 
    });
  };

  const handleCreateIssue = async (data: {
    projectId: string;
    title: string;
    description?: string;
    typeId: string;
    statusId?: string;
    priority?: IssuePriority;
    assigneeId?: string;
    sprintId?: string;
    storyPoints?: number;
  }) => {
    const newIssue = await api.createIssue(data);
    setIssues(prev => [...prev, newIssue]);
    if (currentProject) {
      setCurrentProject(prev => prev ? ({ ...prev, issueCount: prev.issueCount + 1 }) : null);
    }
  };

  const handleUpdateIssue = async (id: string, updates: Partial<IssueDetail>) => {
    const updated = await api.updateIssue(id, updates);
    setIssues(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i));
    if (selectedIssue && selectedIssue.id === id) {
      setSelectedIssue(prev => prev ? { ...prev, ...updated } : null);
    }
  };

  const handleDeleteIssue = async (id: string) => {
    await api.deleteIssue(id);
    setIssues(prev => prev.filter(i => i.id !== id));
    if (currentProject) {
      setCurrentProject(prev => prev ? ({ ...prev, issueCount: Math.max(0, prev.issueCount - 1) }) : null);
    }
  };

  const handleAddComment = async (issueId: string, content: string) => {
    const comment = await api.addComment(issueId, content);
    setIssues(prev => prev.map(i => {
      if (i.id === issueId) {
        const detail = i as IssueDetail;
        return {
          ...i,
          commentCount: i.commentCount + 1,
          comments: [...(detail.comments || []), comment]
        };
      }
      return i;
    }));
    if (selectedIssue && selectedIssue.id === issueId) {
      const detail = selectedIssue as IssueDetail;
      setSelectedIssue({
        ...selectedIssue,
        commentCount: selectedIssue.commentCount + 1,
        comments: [...(detail.comments || []), comment]
      } as IssueDetail);
    }
  };

  // Sprint Handlers
  const handleCreateSprint = async (data: { name: string; goal?: string; startDate?: string; endDate?: string }) => {
    if (!currentProject) return;
    const newSprint = await api.createSprint(currentProject.id, data);
    setSprints(prev => [...prev, newSprint]);
  };

  const handleStartSprint = async (id: string) => {
    const updated = await api.startSprint(id);
    setSprints(prev => prev.map(s => s.id === id ? updated : s));
  };

  const handleCompleteSprint = async (id: string) => {
    const updated = await api.completeSprint(id);
    setSprints(prev => prev.map(s => s.id === id ? updated : s));
    setIssues(prev => prev.map(i => {
      if (i.sprintId === id && !i.isCompletedStatus) {
        return { ...i, sprintId: undefined, sprintName: undefined };
      }
      return i;
    }));
  };

  // Team Member Handler
  const handleAddMember = async (email: string, role: ProjectRole) => {
    if (!currentProject) return;
    const member = await api.addMember(currentProject.id, email, role);
    setCurrentProject(prev => prev ? ({
      ...prev,
      memberCount: prev.memberCount + 1,
      members: [...prev.members, member]
    }) : null);
  };

  const handleMarkAllNotificationsRead = async () => {
    await api.markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const activeSprint = sprints.find(s => s.status === 'Active');

  if (loading) {
    return (
      <div className="loading-screen" id="app-loading-screen">
        <div className="loading-spinner" />
        <p className="loading-text">Đang kết nối TaskFlow Workspace...</p>
      </div>
    );
  }

  if (loadError || !currentProject) {
    return (
      <div className="loading-screen" id="app-loading-screen" style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '440px', margin: '0 auto', background: 'var(--bg-secondary)', padding: '28px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            Kết Nối Máy Chủ API
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 20px 0' }}>
            {loadError || 'Máy chủ Render có thể cần khoảng 20-30 giây để thức dậy từ chế độ ngủ (Sleep mode). Vui lòng nhấn nút bên dưới để tải dữ liệu.'}
          </p>
          <button
            onClick={loadInitialData}
            className="btn btn-primary"
            style={{ padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            Thử Lại Ngay (Retry)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout" id="taskflow-app-root">
      {/* Top Navigation */}
      <Navbar
        currentProject={currentProject}
        projects={projects}
        onSelectProject={handleSelectProject}
        onOpenCreateIssue={() => {
          setCreateIssueInitialStatusId(undefined);
          setCreateIssueInitialSprintId(activeSprint?.id);
          setIsCreateIssueOpen(true);
        }}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onSelectIssueByKey={handleSelectIssueByKey}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="app-main-body">
        {/* Left Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          currentProject={currentProject}
          activeSprint={activeSprint}
          filterAssigneeId={filterAssigneeId}
          onFilterAssignee={setFilterAssigneeId}
          onOpenCsvModal={() => setIsCsvModalOpen(true)}
        />

        {/* Center Content View */}
        <main className="content-viewport" id="content-viewport">
          {currentView === 'board' && (
            <KanbanBoard
              project={currentProject}
              issues={issues}
              workflowTransitions={workflowTransitions}
              onSelectIssue={setSelectedIssue}
              onMoveIssue={handleMoveIssue}
              onQuickAddIssue={(statusId) => {
                setCreateIssueInitialStatusId(statusId);
                setCreateIssueInitialSprintId(activeSprint?.id);
                setIsCreateIssueOpen(true);
              }}
              onRequireResolution={(issue, targetStatusId, targetStatusName) => {
                setResolutionModalData({ issue, targetStatusId, targetStatusName });
              }}
              searchQuery={searchQuery}
              filterAssigneeId={filterAssigneeId}
            />
          )}

          {currentView === 'backlog' && (
            <BacklogView
              project={currentProject}
              sprints={sprints}
              issues={issues}
              onSelectIssue={setSelectedIssue}
              onOpenCreateSprint={() => setIsCreateSprintOpen(true)}
              onStartSprint={handleStartSprint}
              onCompleteSprint={handleCompleteSprint}
              onMoveIssueToSprint={handleMoveIssueToSprint}
              onOpenCreateIssue={(sprintId) => {
                setCreateIssueInitialStatusId(undefined);
                setCreateIssueInitialSprintId(sprintId);
                setIsCreateIssueOpen(true);
              }}
            />
          )}

          {currentView === 'reports' && (
            <AgileReportsView
              project={currentProject}
              activeSprint={activeSprint}
            />
          )}

          {currentView === 'settings' && (
            <ProjectSettingsView
              project={currentProject}
              onAddMember={handleAddMember}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {selectedIssue && (
        <IssueModal
          issue={selectedIssue}
          project={currentProject}
          sprints={sprints}
          allIssues={issues}
          workflowTransitions={workflowTransitions}
          onClose={() => setSelectedIssue(null)}
          onUpdateIssue={handleUpdateIssue}
          onDeleteIssue={handleDeleteIssue}
          onAddComment={handleAddComment}
          onSelectIssue={setSelectedIssue}
          onRequireResolution={(issue, targetStatusId, targetStatusName) => {
            setResolutionModalData({ issue, targetStatusId, targetStatusName });
          }}
        />
      )}

      {isCreateIssueOpen && (
        <CreateIssueModal
          project={currentProject}
          initialStatusId={createIssueInitialStatusId}
          initialSprintId={createIssueInitialSprintId}
          onClose={() => setIsCreateIssueOpen(false)}
          onCreate={handleCreateIssue}
        />
      )}

      {isCreateSprintOpen && (
        <CreateSprintModal
          onClose={() => setIsCreateSprintOpen(false)}
          onCreate={handleCreateSprint}
        />
      )}

      {resolutionModalData && (
        <ResolutionModal
          isOpen={!!resolutionModalData}
          issue={resolutionModalData.issue}
          targetStatusName={resolutionModalData.targetStatusName}
          onClose={() => setResolutionModalData(null)}
          onConfirm={async (resolution, comment) => {
            const { issue, targetStatusId } = resolutionModalData;
            await handleMoveIssue(issue.id, targetStatusId);
            if (comment) {
              await handleAddComment(issue.id, `[${resolution}] ${comment}`);
            }
            setResolutionModalData(null);
          }}
        />
      )}

      <CsvImportExportModal
        project={currentProject}
        activeSprint={activeSprint}
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportSuccess={async () => {
          if (currentProject) {
            const reloadedIssues = await api.getIssues(currentProject.id);
            setIssues(reloadedIssues);
            setLiveToast('Đã cập nhật danh sách issues sau khi nhập CSV.');
          }
        }}
      />

      {/* Realtime Live Toast Banner */}
      {liveToast && (
        <div className="realtime-live-toast glass-panel" id="realtime-toast">
          <Radio size={16} className="text-primary animate-pulse" />
          <span className="toast-text">{liveToast}</span>
        </div>
      )}
    </div>
  );
}
