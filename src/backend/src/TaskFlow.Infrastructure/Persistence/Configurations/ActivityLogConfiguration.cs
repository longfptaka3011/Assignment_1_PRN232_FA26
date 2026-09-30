using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Persistence.Configurations;

public class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLog>
{
    public void Configure(EntityTypeBuilder<ActivityLog> builder)
    {
        builder.ToTable("activity_logs");

        builder.HasKey(al => al.Id);

        builder.Property(al => al.ActivityType)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(al => al.FieldName)
            .HasMaxLength(50);

        builder.HasIndex(al => new { al.IssueId, al.CreatedAt });

        builder.HasOne(al => al.Issue)
            .WithMany(i => i.ActivityLogs)
            .HasForeignKey(al => al.IssueId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(al => al.User)
            .WithMany(u => u.ActivityLogs)
            .HasForeignKey(al => al.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
