using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Persistence.Configurations;

public class IssueWatcherConfiguration : IEntityTypeConfiguration<IssueWatcher>
{
    public void Configure(EntityTypeBuilder<IssueWatcher> builder)
    {
        builder.ToTable("issue_watchers");

        builder.HasKey(iw => new { iw.IssueId, iw.UserId });

        builder.HasOne(iw => iw.Issue)
            .WithMany(i => i.Watchers)
            .HasForeignKey(iw => iw.IssueId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(iw => iw.User)
            .WithMany(p => p.WatchedIssues)
            .HasForeignKey(iw => iw.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
