import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import type { Issue, ProjectDetail, WorkflowTransition } from '../types';
import { 
  Plus, 
  MessageSquare, 
  CheckCircle2, 
  Bookmark, 
  ClipboardList, 
  Bug, 
  ArrowUp, 
  ArrowDown, 
  AlertCircle,
  GripVertical
} from 'lucide-react';

interface KanbanBoardProps {
  project: ProjectDetail;
  issues: Issue[];
  workflowTransitions?: WorkflowTransition[];
  onSelectIssue: (issue: Issue) => void;
  onMoveIssue: (issueId: string, newStatusId: string) => void;
  onQuickAddIssue: (statusId: string) => void;
  onRequireResolution?: (issue: Issue, targetStatusId: string, targetStatusName: string) => void;
  searchQuery: string;
  filterAssigneeId: string | null;
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'Urgent':
      return <span title="Urgent Priority"><AlertCircle size={14} className="priority-icon urgent" /></span>;
    case 'High':
      return <span title="High Priority"><ArrowUp size={14} className="priority-icon high" /></span>;
    case 'Medium':
      return <span className="priority-indicator medium" title="Medium Priority" />;
    case 'Low':
    case 'Lowest':
      return <span title="Low Priority"><ArrowDown size={14} className="priority-icon low" /></span>;
    default:
      return null;
  }
};

const getTypeIcon = (category: string) => {
  switch (category) {
    case 'Epic':
      return <Bookmark size={14} className="type-icon epic" />;
    case 'Story':
      return <CheckCircle2 size={14} className="type-icon story" />;
    case 'Bug':
      return <Bug size={14} className="type-icon bug" />;
    default:
      return <ClipboardList size={14} className="type-icon task" />;
  }
};

interface DraggableCardProps {
  issue: Issue;
  onSelect: () => void;
  isDragging?: boolean;
}

function DraggableCard({ issue, onSelect, isDragging }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: issue.id,
    data: { issue },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card glass-panel ${isDragging ? 'is-dragging' : ''}`}
      id={`issue-card-${issue.issueKey}`}
      onClick={onSelect}
    >
      {/* Card Top: Type & Key & Priority */}
      <div className="card-top-row">
        <div className="card-type-key">
          <div {...listeners} {...attributes} className="drag-handle-grip" title="Drag to move">
            <GripVertical size={13} className="text-muted-color" />
          </div>
          {getTypeIcon(issue.typeCategory)}
          <span className="badge badge-key small">{issue.issueKey}</span>
        </div>
        <div className="card-priority">
          {getPriorityIcon(issue.priority)}
        </div>
      </div>

      {/* Card Title */}
      <h3 className="card-title">{issue.title}</h3>

      {/* Card Labels */}
      {issue.labels && issue.labels.length > 0 && (
        <div className="card-labels-list">
          {issue.labels.map(label => (
            <span
              key={label.id}
              className="card-label-chip"
              style={{ 
                backgroundColor: `${label.colorHex}22`,
                color: label.colorHex,
                borderColor: `${label.colorHex}44` 
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Card Bottom Meta */}
      <div className="card-bottom-row">
        <div className="card-metrics">
          {issue.storyPoints !== undefined && issue.storyPoints !== null && (
            <span className="story-points-badge" title="Story Points">
              {issue.storyPoints}
            </span>
          )}
          {issue.commentCount > 0 && (
            <span className="card-comments-metric">
              <MessageSquare size={12} />
              <span>{issue.commentCount}</span>
            </span>
          )}
        </div>

        <div className="card-assignee">
          {issue.assigneeAvatarUrl ? (
            <img 
              src={issue.assigneeAvatarUrl} 
              alt={issue.assigneeName || 'Assignee'} 
              className="card-avatar"
              title={issue.assigneeName}
            />
          ) : (
            <div className="card-avatar unassigned" title="Unassigned">
              ?
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DroppableColumnProps {
  status: ProjectDetail['issueStatuses'][0];
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onQuickAddIssue: (statusId: string) => void;
}

function DroppableColumn({ status, issues, onSelectIssue, onQuickAddIssue }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: { statusId: status.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'column-drag-over' : ''}`}
      id={`kanban-col-${status.name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Column Header */}
      <div className="column-header">
        <div className="column-title-group">
          <span 
            className="column-color-indicator" 
            style={{ backgroundColor: status.colorHex }} 
          />
          <h2 className="column-name">{status.name}</h2>
          <span className="column-count-badge">{issues.length}</span>
        </div>
        <button 
          className="icon-btn-subtle" 
          onClick={() => onQuickAddIssue(status.id)}
          title="Add issue to this column"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Cards List */}
      <div className="column-cards-list">
        {issues.map(issue => (
          <DraggableCard
            key={issue.id}
            issue={issue}
            onSelect={() => onSelectIssue(issue)}
          />
        ))}

        {issues.length === 0 && (
          <div className="column-empty-placeholder">
            <span>No issues</span>
          </div>
        )}
      </div>

      {/* Quick Add Button */}
      <button 
        className="column-quick-add-btn"
        onClick={() => onQuickAddIssue(status.id)}
      >
        <Plus size={14} />
        <span>Add issue</span>
      </button>
    </div>
  );
}

export function KanbanBoard({
  project,
  issues,
  workflowTransitions,
  onSelectIssue,
  onMoveIssue,
  onQuickAddIssue,
  onRequireResolution,
  searchQuery,
  filterAssigneeId
}: KanbanBoardProps) {
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4, // 4px drag distance prevents accidental drag on simple click
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Filter issues based on search and filters
  const filteredIssues = issues.filter(issue => {
    if (filterAssigneeId && issue.assigneeId !== filterAssigneeId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchKey = issue.issueKey.toLowerCase().includes(q);
      const matchTitle = issue.title.toLowerCase().includes(q);
      const matchDesc = issue.description?.toLowerCase().includes(q);
      if (!matchKey && !matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const handleDragStart = (event: DragStartEvent) => {
    const issue = issues.find(i => i.id === event.active.id);
    if (issue) {
      setActiveIssue(issue);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);

    if (!over) return;

    const issueId = active.id as string;
    let targetStatusId: string | null = null;

    // Check if dropped directly over a column
    const directColumn = project.issueStatuses.find(s => s.id === over.id);
    if (directColumn) {
      targetStatusId = directColumn.id;
    } else {
      // Check if dropped over another issue card in a column
      const targetIssue = issues.find(i => i.id === over.id);
      if (targetIssue) {
        targetStatusId = targetIssue.statusId;
      }
    }

    if (targetStatusId) {
      const currentIssue = issues.find(i => i.id === issueId);
      if (currentIssue && currentIssue.statusId !== targetStatusId) {
        const targetStatus = project.issueStatuses.find(s => s.id === targetStatusId);

        // Workflow transition validation (Nhóm C - Workflow Engine)
        if (workflowTransitions && workflowTransitions.length > 0) {
          const isAllowed = workflowTransitions.some(
            t => t.fromStatusId === currentIssue.statusId && t.toStatusId === targetStatusId
          );
          if (!isAllowed) {
            alert(`Quy tắc Workflow: Không thể chuyển trực tiếp từ "${currentIssue.statusName}" sang "${targetStatus?.name || 'mục tiêu'}". Vui lòng tuân theo luồng trạng thái của dự án.`);
            return;
          }
        }

        // Prompt for Resolution & Comment when moving to completed status (e.g. Done)
        if (targetStatus?.isCompletedStatus && onRequireResolution) {
          onRequireResolution(currentIssue, targetStatusId, targetStatus.name);
          return;
        }

        onMoveIssue(issueId, targetStatusId);
      }
    }
  };

  return (
    <div className="kanban-board-container" id="kanban-board-view">
      <div className="board-header">
        <div>
          <h1 className="board-title">Sprint Board</h1>
          <p className="board-subtitle">Track, update, and manage tasks across your agile development workflow with @dnd-kit.</p>
        </div>
        <div className="board-actions">
          <span className="total-cards-indicator">
            {filteredIssues.length} active issue{filteredIssues.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-columns-container">
          {project.issueStatuses.map(status => {
            const columnIssues = filteredIssues
              .filter(i => i.statusId === status.id)
              .sort((a, b) => a.position.localeCompare(b.position));

            return (
              <DroppableColumn
                key={status.id}
                status={status}
                issues={columnIssues}
                onSelectIssue={onSelectIssue}
                onQuickAddIssue={onQuickAddIssue}
              />
            );
          })}
        </div>

        {/* Drag Overlay for smooth card movement */}
        <DragOverlay>
          {activeIssue ? (
            <div className="kanban-card glass-panel drag-overlay-card">
              <div className="card-top-row">
                <div className="card-type-key">
                  {getTypeIcon(activeIssue.typeCategory)}
                  <span className="badge badge-key small">{activeIssue.issueKey}</span>
                </div>
                <div className="card-priority">
                  {getPriorityIcon(activeIssue.priority)}
                </div>
              </div>
              <h3 className="card-title">{activeIssue.title}</h3>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
