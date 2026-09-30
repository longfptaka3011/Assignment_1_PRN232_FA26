using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Persistence.Configurations;

public class LabelConfiguration : IEntityTypeConfiguration<Label>
{
    public void Configure(EntityTypeBuilder<Label> builder)
    {
        builder.ToTable("labels");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.Name)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(l => l.ColorHex)
            .HasMaxLength(7)
            .IsRequired();

        builder.HasIndex(l => new { l.ProjectId, l.Name })
            .IsUnique();

        builder.HasOne(l => l.Project)
            .WithMany(p => p.Labels)
            .HasForeignKey(l => l.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
