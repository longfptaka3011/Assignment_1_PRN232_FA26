using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Persistence.Configurations;

public class ProfileConfiguration : IEntityTypeConfiguration<Profile>
{
    public void Configure(EntityTypeBuilder<Profile> builder)
    {
        builder.ToTable("profiles");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever();

        builder.Property(p => p.Email)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(p => p.FullName)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(p => p.AvatarUrl)
            .HasMaxLength(1000);
    }
}
