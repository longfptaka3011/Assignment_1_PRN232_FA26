using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Persistence.Configurations;

public class IssueLinkConfiguration : IEntityTypeConfiguration<IssueLink>
{
    public void Configure(EntityTypeBuilder<IssueLink> builder)
    {
        builder.ToTable("issue_links");

        builder.HasKey(il => il.Id);

        builder.Property(il => il.LinkType)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.HasOne(il => il.SourceIssue)
            .WithMany(i => i.IssueLinksAsSource)
            .HasForeignKey(il => il.SourceIssueId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(il => il.TargetIssue)
            .WithMany(i => i.IssueLinksAsTarget)
            .HasForeignKey(il => il.TargetIssueId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(il => il.Creator)
            .WithMany()
            .HasForeignKey(il => il.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(il => new { il.SourceIssueId, il.TargetIssueId, il.LinkType })
            .IsUnique();
    }
}
