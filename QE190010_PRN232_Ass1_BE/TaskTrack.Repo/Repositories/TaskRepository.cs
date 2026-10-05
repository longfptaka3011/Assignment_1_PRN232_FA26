using Microsoft.EntityFrameworkCore;
using TaskTrack.Repo.Models;
using TaskEntity = TaskTrack.Repo.Models.Task;

namespace TaskTrack.Repo.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly TaskTrackDbContext _context;

    public TaskRepository(TaskTrackDbContext context)
    {
        _context = context;
    }

    public async System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetAllActiveAsync()
    {
        return await _context.Tasks
            .Include(t => t.Tags)
            .Include(t => t.Project)
            .Where(t => t.IsActive)
            .OrderBy(t => t.TaskId)
            .ToListAsync();
    }

    public async System.Threading.Tasks.Task<TaskEntity?> GetByIdWithTagsAsync(int id)
    {
        return await _context.Tasks
            .Include(t => t.Tags)
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.TaskId == id);
    }

    public async System.Threading.Tasks.Task<TaskEntity?> GetByIdAsync(int id)
    {
        return await _context.Tasks.FindAsync(id);
    }

    public async System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetByProjectIdAsync(int projectId)
    {
        return await _context.Tasks
            .Include(t => t.Tags)
            .Where(t => t.ProjectId == projectId && t.IsActive)
            .OrderBy(t => t.TaskId)
            .ToListAsync();
    }

    public async System.Threading.Tasks.Task<TaskEntity> CreateAsync(TaskEntity task, IEnumerable<int>? tagIds)
    {
        task.CreatedDate = DateTime.UtcNow;
        task.IsActive = true;

        if (tagIds != null && tagIds.Any())
        {
            var tags = await _context.Tags
                .Where(tg => tagIds.Contains(tg.TagId))
                .ToListAsync();
            task.Tags = tags;
        }

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();
        return task;
    }

    public async System.Threading.Tasks.Task UpdateAsync(TaskEntity task, IEnumerable<int>? tagIds)
    {
        var existingTask = await _context.Tasks
            .Include(t => t.Tags)
            .FirstOrDefaultAsync(t => t.TaskId == task.TaskId);

        if (existingTask == null)
            throw new KeyNotFoundException($"Task with ID {task.TaskId} not found.");

        existingTask.Title = task.Title;
        existingTask.Description = task.Description;
        existingTask.Status = task.Status;
        existingTask.Priority = task.Priority;
        existingTask.DueDate = task.DueDate;
        existingTask.ProjectId = task.ProjectId;
        existingTask.IsActive = task.IsActive;
        existingTask.ModifiedDate = DateTime.UtcNow;

        if (tagIds != null)
        {
            var selectedTagIds = tagIds.Distinct().ToList();
            var newTags = await _context.Tags
                .Where(tg => selectedTagIds.Contains(tg.TagId))
                .ToListAsync();

            existingTask.Tags.Clear();
            foreach (var tg in newTags)
            {
                existingTask.Tags.Add(tg);
            }
        }

        await _context.SaveChangesAsync();
    }

    public async System.Threading.Tasks.Task SoftDeleteAsync(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task != null)
        {
            task.IsActive = false;
            task.ModifiedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async System.Threading.Tasks.Task<IEnumerable<TaskEntity>> SearchAsync(string? title, short? status, short? priority, int? projectId, int? tagId)
    {
        var query = _context.Tasks
            .Include(t => t.Tags)
            .Include(t => t.Project)
            .Where(t => t.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(title))
        {
            query = query.Where(t => EF.Functions.ILike(t.Title, $"%{title}%"));
        }

        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }

        if (priority.HasValue)
        {
            query = query.Where(t => t.Priority == priority.Value);
        }

        if (projectId.HasValue)
        {
            query = query.Where(t => t.ProjectId == projectId.Value);
        }

        if (tagId.HasValue)
        {
            query = query.Where(t => t.Tags.Any(tg => tg.TagId == tagId.Value));
        }

        return await query.OrderBy(t => t.TaskId).ToListAsync();
    }
}
