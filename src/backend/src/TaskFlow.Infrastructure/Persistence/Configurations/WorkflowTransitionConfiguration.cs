using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Persistence.Configurations;

public class WorkflowTransitionConfiguration : IEntityTypeConfiguration<WorkflowTransition>
{
    public void Configure(EntityTypeBuilder<WorkflowTransition> builder)
    {
        builder.ToTable("workflow_transitions");

        builder.HasKey(wt => wt.Id);

        builder.Property(wt => wt.Name)
            .HasMaxLength(100);

        builder.HasOne(wt => wt.Project)
            .WithMany(p => p.WorkflowTransitions)
            .HasForeignKey(wt => wt.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(wt => wt.FromStatus)
            .WithMany(s => s.OutgoingTransitions)
            .HasForeignKey(wt => wt.FromStatusId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(wt => wt.ToStatus)
            .WithMany(s => s.IncomingTransitions)
            .HasForeignKey(wt => wt.ToStatusId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(wt => new { wt.ProjectId, wt.FromStatusId, wt.ToStatusId })
            .IsUnique();
    }
}
