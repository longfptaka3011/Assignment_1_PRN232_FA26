using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Persistence.Configurations;

public class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("projects");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(p => p.Key)
            .HasMaxLength(10)
            .IsRequired();

        builder.HasIndex(p => p.Key)
            .IsUnique();

        builder.Property(p => p.IssueCounter)
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(p => p.IsArchived)
            .HasDefaultValue(false);

        builder.HasOne(p => p.Lead)
            .WithMany(u => u.LedProjects)
            .HasForeignKey(p => p.LeadId)
            .OnDelete(DeleteBehavior.Restrict);

        // Global query filter for soft delete
        builder.HasQueryFilter(p => p.DeletedAt == null);
    }
}
