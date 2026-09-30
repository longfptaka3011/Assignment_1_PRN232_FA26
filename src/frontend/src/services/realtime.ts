import { supabase, isSupabaseConfigured } from './supabase';
import { Issue, Notification } from '../types';

export interface RealtimeIssueCallbacks {
  onInsert?: (issue: Partial<Issue>) => void;
  onUpdate?: (issue: Partial<Issue>) => void;
  onDelete?: (issueId: string) => void;
}

export const realtimeService = {
  /**
   * Subscribe to real-time changes on issues for a specific project
   */
  subscribeToProjectIssues(
    projectId: string,
    callbacks: RealtimeIssueCallbacks
  ): () => void {
    if (!isSupabaseConfigured()) {
      // In standalone / demo mode, return an empty unsubscriber
      return () => {};
    }

    const channelName = `realtime:project-issues:${projectId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && callbacks.onInsert) {
            const row: any = payload.new;
            callbacks.onInsert({
              id: row.id,
              projectId: row.project_id,
              issueNumber: row.issue_number,
              issueKey: row.issue_key,
              title: row.title,
              description: row.description,
              typeId: row.type_id,
              statusId: row.status_id,
              priority: row.priority,
              assigneeId: row.assignee_id,
              sprintId: row.sprint_id,
              parentId: row.parent_id,
              storyPoints: row.story_points,
              position: row.position,
              rowVersion: row.row_version,
              updatedAt: row.updated_at
            });
          } else if (payload.eventType === 'UPDATE' && callbacks.onUpdate) {
            const row: any = payload.new;
            callbacks.onUpdate({
              id: row.id,
              projectId: row.project_id,
              issueNumber: row.issue_number,
              issueKey: row.issue_key,
              title: row.title,
              description: row.description,
              typeId: row.type_id,
              statusId: row.status_id,
              priority: row.priority,
              assigneeId: row.assignee_id,
              sprintId: row.sprint_id,
              parentId: row.parent_id,
              storyPoints: row.story_points,
              position: row.position,
              rowVersion: row.row_version,
              updatedAt: row.updated_at
            });
          } else if (payload.eventType === 'DELETE' && callbacks.onDelete) {
            const oldRow: any = payload.old;
            if (oldRow?.id) {
              callbacks.onDelete(oldRow.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to real-time notifications for the logged-in user
   */
  subscribeToUserNotifications(
    userId: string,
    onNewNotification: (notification: Notification) => void
  ): () => void {
    if (!isSupabaseConfigured() || !userId) {
      return () => {};
    }

    const channelName = `realtime:user-notifs:${userId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          const row: any = payload.new;
          const notif: Notification = {
            id: row.id,
            recipientId: row.recipient_id,
            senderId: row.sender_id,
            senderName: row.sender_name || 'System',
            senderAvatarUrl: row.sender_avatar_url,
            type: row.type,
            title: row.title,
            message: row.message,
            linkUrl: row.link_url,
            isRead: row.is_read || false,
            createdAt: row.created_at || new Date().toISOString()
          };
          onNewNotification(notif);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
