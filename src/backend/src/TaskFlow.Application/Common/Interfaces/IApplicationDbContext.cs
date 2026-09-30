using Microsoft.EntityFrameworkCore;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Profile> Profiles { get; }
    DbSet<Project> Projects { get; }
    DbSet<ProjectMember> ProjectMembers { get; }
    DbSet<IssueType> IssueTypes { get; }
    DbSet<IssueStatus> IssueStatuses { get; }
    DbSet<Sprint> Sprints { get; }
    DbSet<Issue> Issues { get; }
    DbSet<Label> Labels { get; }
    DbSet<IssueLabel> IssueLabels { get; }
    DbSet<Comment> Comments { get; }
    DbSet<Attachment> Attachments { get; }
    DbSet<ActivityLog> ActivityLogs { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<WorkflowTransition> WorkflowTransitions { get; }
    DbSet<IssueLink> IssueLinks { get; }
    DbSet<IssueWatcher> IssueWatchers { get; }
    DbSet<SavedFilter> SavedFilters { get; }
    DbSet<WorkLog> WorkLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
