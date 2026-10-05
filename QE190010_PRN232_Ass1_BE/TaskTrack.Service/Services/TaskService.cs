using TaskTrack.Repo.Repositories;
using TaskTrack.Service.DTOs;
using TaskEntity = TaskTrack.Repo.Models.Task;

namespace TaskTrack.Service.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepo;
    private readonly IProjectRepository _projRepo;

    public TaskService(ITaskRepository taskRepo, IProjectRepository projRepo)
    {
        _taskRepo = taskRepo;
        _projRepo = projRepo;
    }

    public async System.Threading.Tasks.Task<IEnumerable<TaskDto>> GetAllActiveAsync()
    {
        var tasks = await _taskRepo.GetAllActiveAsync();
        return tasks.Select(t => MapToDto(t));
    }

    public async System.Threading.Tasks.Task<TaskDetailDto?> GetByIdWithTagsAsync(int id)
    {
        var t = await _taskRepo.GetByIdWithTagsAsync(id);
        if (t == null) return null;

        return new TaskDetailDto
        {
            TaskId = t.TaskId,
            Title = t.Title,
            Description = t.Description,
            Status = t.Status,
            Priority = t.Priority,
            DueDate = t.DueDate,
            ProjectId = t.ProjectId,
            ProjectName = t.Project?.ProjectName,
            IsActive = t.IsActive,
            CreatedDate = t.CreatedDate,
            ModifiedDate = t.ModifiedDate,
            Tags = t.Tags.Select(tg => new TagDto
            {
                TagId = tg.TagId,
                TagName = tg.TagName,
                Color = tg.Color
            }).ToList()
        };
    }

    public async System.Threading.Tasks.Task<TaskDto?> GetByIdAsync(int id)
    {
        var t = await _taskRepo.GetByIdWithTagsAsync(id);
        if (t == null) return null;
        return MapToDto(t);
    }

    public async System.Threading.Tasks.Task<IEnumerable<TaskDto>> GetByProjectIdAsync(int projectId)
    {
        var tasks = await _taskRepo.GetByProjectIdAsync(projectId);
        return tasks.Select(t => MapToDto(t));
    }

    public async System.Threading.Tasks.Task<TaskDto> CreateAsync(CreateTaskDto dto)
    {
        var project = await _projRepo.GetByIdAsync(dto.ProjectId);
        if (project == null)
            throw new ArgumentException($"Project with ID {dto.ProjectId} does not exist.");

        var entity = new TaskEntity
        {
            Title = dto.Title,
            Description = dto.Description,
            Status = dto.Status,
            Priority = dto.Priority,
            DueDate = dto.DueDate,
            ProjectId = dto.ProjectId,
            IsActive = dto.IsActive,
            CreatedDate = DateTime.UtcNow
        };

        var created = await _taskRepo.CreateAsync(entity, dto.TagIds);
        var refreshed = await _taskRepo.GetByIdWithTagsAsync(created.TaskId);
        return MapToDto(refreshed ?? created);
    }

    public async System.Threading.Tasks.Task<TaskDto?> UpdateAsync(int id, UpdateTaskDto dto)
    {
        var existing = await _taskRepo.GetByIdAsync(id);
        if (existing == null) return null;

        var project = await _projRepo.GetByIdAsync(dto.ProjectId);
        if (project == null)
            throw new ArgumentException($"Project with ID {dto.ProjectId} does not exist.");

        existing.Title = dto.Title;
        existing.Description = dto.Description;
        existing.Status = dto.Status;
        existing.Priority = dto.Priority;
        existing.DueDate = dto.DueDate;
        existing.ProjectId = dto.ProjectId;
        existing.IsActive = dto.IsActive;

        await _taskRepo.UpdateAsync(existing, dto.TagIds);
        var refreshed = await _taskRepo.GetByIdWithTagsAsync(id);
        return MapToDto(refreshed ?? existing);
    }

    public async System.Threading.Tasks.Task<bool> SoftDeleteAsync(int id)
    {
        var existing = await _taskRepo.GetByIdAsync(id);
        if (existing == null) return false;

        await _taskRepo.SoftDeleteAsync(id);
        return true;
    }

    public async System.Threading.Tasks.Task<IEnumerable<TaskDto>> SearchAsync(string? title, short? status, short? priority, int? projectId, int? tagId)
    {
        var tasks = await _taskRepo.SearchAsync(title, status, priority, projectId, tagId);
        return tasks.Select(t => MapToDto(t));
    }

    private static TaskDto MapToDto(TaskEntity t)
    {
        return new TaskDto
        {
            TaskId = t.TaskId,
            Title = t.Title,
            Description = t.Description,
            Status = t.Status,
            Priority = t.Priority,
            DueDate = t.DueDate,
            ProjectId = t.ProjectId,
            ProjectName = t.Project?.ProjectName,
            IsActive = t.IsActive,
            CreatedDate = t.CreatedDate,
            ModifiedDate = t.ModifiedDate,
            Tags = t.Tags.Select(tg => new TagDto
            {
                TagId = tg.TagId,
                TagName = tg.TagName,
                Color = tg.Color
            }).ToList()
        };
    }
}
