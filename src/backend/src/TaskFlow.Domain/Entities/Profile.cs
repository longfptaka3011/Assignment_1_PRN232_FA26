using TaskFlow.Domain.Common;

namespace TaskFlow.Domain.Entities;

public class Profile : BaseEntity
{
    // Id is the Supabase auth.users UUID
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<ProjectMember> ProjectMemberships { get; set; } = new List<ProjectMember>();
    public ICollection<Project> LedProjects { get; set; } = new List<Project>();
    public ICollection<Issue> AssignedIssues { get; set; } = new List<Issue>();
    public ICollection<Issue> ReportedIssues { get; set; } = new List<Issue>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
    public ICollection<Notification> ReceivedNotifications { get; set; } = new List<Notification>();
    public ICollection<Notification> SentNotifications { get; set; } = new List<Notification>();
    public ICollection<SavedFilter> SavedFilters { get; set; } = new List<SavedFilter>();
    public ICollection<IssueWatcher> WatchedIssues { get; set; } = new List<IssueWatcher>();
    public ICollection<WorkLog> WorkLogs { get; set; } = new List<WorkLog>();
}

