using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Persistence.Configurations;

public class WorkLogConfiguration : IEntityTypeConfiguration<WorkLog>
{
    public void Configure(EntityTypeBuilder<WorkLog> builder)
    {
        builder.ToTable("work_logs");

        builder.HasKey(wl => wl.Id);

        builder.Property(wl => wl.TimeSpentMinutes)
            .IsRequired();

        builder.Property(wl => wl.StartedAt)
            .IsRequired();

        builder.HasOne(wl => wl.Issue)
            .WithMany(i => i.WorkLogs)
            .HasForeignKey(wl => wl.IssueId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(wl => wl.User)
            .WithMany(p => p.WorkLogs)
            .HasForeignKey(wl => wl.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(wl => wl.DeletedAt == null);
    }
}
