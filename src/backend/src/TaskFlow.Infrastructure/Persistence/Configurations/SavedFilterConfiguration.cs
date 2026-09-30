using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Persistence.Configurations;

public class SavedFilterConfiguration : IEntityTypeConfiguration<SavedFilter>
{
    public void Configure(EntityTypeBuilder<SavedFilter> builder)
    {
        builder.ToTable("saved_filters");

        builder.HasKey(sf => sf.Id);

        builder.Property(sf => sf.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(sf => sf.FilterQuery)
            .HasColumnType("jsonb")
            .IsRequired();

        builder.HasOne(sf => sf.User)
            .WithMany(p => p.SavedFilters)
            .HasForeignKey(sf => sf.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(sf => sf.Project)
            .WithMany(p => p.SavedFilters)
            .HasForeignKey(sf => sf.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(sf => sf.DeletedAt == null);
    }
}
