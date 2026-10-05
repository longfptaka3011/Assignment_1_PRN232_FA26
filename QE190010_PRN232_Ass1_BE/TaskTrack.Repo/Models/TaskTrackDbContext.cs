using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace TaskTrack.Repo.Models;

public partial class TaskTrackDbContext : DbContext
{
    public TaskTrackDbContext()
    {
    }

    public TaskTrackDbContext(DbContextOptions<TaskTrackDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Department> Departments { get; set; }

    public virtual DbSet<Project> Projects { get; set; }

    public virtual DbSet<Tag> Tags { get; set; }

    public virtual DbSet<Task> Tasks { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .HasPostgresEnum("auth", "aal_level", new[] { "aal1", "aal2", "aal3" })
            .HasPostgresEnum("auth", "code_challenge_method", new[] { "s256", "plain" })
            .HasPostgresEnum("auth", "factor_status", new[] { "unverified", "verified" })
            .HasPostgresEnum("auth", "factor_type", new[] { "totp", "webauthn", "phone", "recovery_code" })
            .HasPostgresEnum("auth", "oauth_authorization_status", new[] { "pending", "approved", "denied", "expired" })
            .HasPostgresEnum("auth", "oauth_client_type", new[] { "public", "confidential" })
            .HasPostgresEnum("auth", "oauth_registration_type", new[] { "dynamic", "manual" })
            .HasPostgresEnum("auth", "oauth_response_type", new[] { "code" })
            .HasPostgresEnum("auth", "one_time_token_type", new[] { "confirmation_token", "reauthentication_token", "recovery_token", "email_change_token_new", "email_change_token_current", "phone_change_token" })
            .HasPostgresEnum("realtime", "action", new[] { "INSERT", "UPDATE", "DELETE", "TRUNCATE", "ERROR" })
            .HasPostgresEnum("realtime", "equality_op", new[] { "eq", "neq", "lt", "lte", "gt", "gte", "in", "like", "ilike", "is", "match", "imatch", "isdistinct" })
            .HasPostgresEnum("storage", "buckettype", new[] { "STANDARD", "ANALYTICS", "VECTOR" })
            .HasPostgresExtension("extensions", "pg_stat_statements")
            .HasPostgresExtension("extensions", "pgcrypto")
            .HasPostgresExtension("extensions", "uuid-ossp")
            .HasPostgresExtension("vault", "supabase_vault");

        modelBuilder.Entity<Department>(entity =>
        {
            entity.HasKey(e => e.DepartmentId).HasName("Department_pkey");

            entity.ToTable("Department", "assignment1");

            entity.Property(e => e.DepartmentId).HasColumnName("DepartmentID");
            entity.Property(e => e.DepartmentDescription).HasMaxLength(300);
            entity.Property(e => e.DepartmentName).HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.ProjectId).HasName("Project_pkey");

            entity.ToTable("Project", "assignment1");

            entity.Property(e => e.ProjectId).HasColumnName("ProjectID");
            entity.Property(e => e.CreatedDate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.DepartmentId).HasColumnName("DepartmentID");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.ProjectName).HasMaxLength(200);

            entity.HasOne(d => d.Department).WithMany(p => p.Projects)
                .HasForeignKey(d => d.DepartmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Project_Department");
        });

        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(e => e.TagId).HasName("Tag_pkey");

            entity.ToTable("Tag", "assignment1");

            entity.HasIndex(e => e.TagName, "Tag_TagName_key").IsUnique();

            entity.Property(e => e.TagId).HasColumnName("TagID");
            entity.Property(e => e.Color).HasMaxLength(7);
            entity.Property(e => e.TagName).HasMaxLength(50);
        });

        modelBuilder.Entity<Task>(entity =>
        {
            entity.HasKey(e => e.TaskId).HasName("Task_pkey");

            entity.ToTable("Task", "assignment1");

            entity.Property(e => e.TaskId).HasColumnName("TaskID");
            entity.Property(e => e.CreatedDate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.ModifiedDate).HasColumnType("timestamp without time zone");
            entity.Property(e => e.Priority).HasDefaultValue((short)1);
            entity.Property(e => e.ProjectId).HasColumnName("ProjectID");
            entity.Property(e => e.Title).HasMaxLength(300);

            entity.HasOne(d => d.Project).WithMany(p => p.Tasks)
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Task_Project");

            entity.HasMany(d => d.Tags).WithMany(p => p.Tasks)
                .UsingEntity<Dictionary<string, object>>(
                    "TaskTag",
                    r => r.HasOne<Tag>().WithMany()
                        .HasForeignKey("TagId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_TaskTag_Tag"),
                    l => l.HasOne<Task>().WithMany()
                        .HasForeignKey("TaskId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_TaskTag_Task"),
                    j =>
                    {
                        j.HasKey("TaskId", "TagId");
                        j.ToTable("TaskTag", "assignment1");
                        j.IndexerProperty<int>("TaskId").HasColumnName("TaskID");
                        j.IndexerProperty<int>("TagId").HasColumnName("TagID");
                    });
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
