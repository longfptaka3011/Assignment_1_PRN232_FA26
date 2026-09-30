using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Persistence.Configurations;

public class IssueConfiguration : IEntityTypeConfiguration<Issue>
{
    public void Configure(EntityTypeBuilder<Issue> builder)
    {
        builder.ToTable("issues");

        builder.HasKey(i => i.Id);

        // PostgreSQL xmin concurrency token mapping via EF Core standard IsRowVersion
        builder.Property(i => i.RowVersion).IsRowVersion();

        builder.Property(i => i.IssueNumber)
            .IsRequired();

        builder.Property(i => i.IssueKey)
            .HasMaxLength(25)
            .IsRequired();

        builder.HasIndex(i => i.IssueKey)
            .IsUnique();

        builder.HasIndex(i => new { i.ProjectId, i.IssueNumber })
            .IsUnique();

        builder.Property(i => i.Title)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(i => i.Priority)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(i => i.Position)
            .HasMaxLength(255)
            .HasDefaultValue("0|hzzzzz:")
            .IsRequired();

        builder.Property(i => i.StoryPoints)
            .HasPrecision(4, 1);

        // Indexes for performance
        builder.HasIndex(i => new { i.ProjectId, i.StatusId, i.Position });
        builder.HasIndex(i => i.AssigneeId);
        builder.HasIndex(i => i.SprintId);
        builder.HasIndex(i => i.ParentId);

        // Relationships
        builder.HasOne(i => i.Project)
            .WithMany(p => p.Issues)
            .HasForeignKey(i => i.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.Type)
            .WithMany(t => t.Issues)
            .HasForeignKey(i => i.TypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Status)
            .WithMany(s => s.Issues)
            .HasForeignKey(i => i.StatusId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Assignee)
            .WithMany(u => u.AssignedIssues)
            .HasForeignKey(i => i.AssigneeId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(i => i.Reporter)
            .WithMany(u => u.ReportedIssues)
            .HasForeignKey(i => i.ReporterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Sprint)
            .WithMany(s => s.Issues)
            .HasForeignKey(i => i.SprintId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(i => i.Parent)
            .WithMany(p => p.Subtasks)
            .HasForeignKey(i => i.ParentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(i => i.DeletedAt == null);
    }
}
