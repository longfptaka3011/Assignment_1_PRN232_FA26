using TaskTrack.Service.DTOs;

namespace TaskTrack.Service.Services;

public interface ITaskService
{
    Task<IEnumerable<TaskDto>> GetAllActiveAsync();
    Task<TaskDetailDto?> GetByIdWithTagsAsync(int id);
    Task<TaskDto?> GetByIdAsync(int id);
    Task<IEnumerable<TaskDto>> GetByProjectIdAsync(int projectId);
    Task<TaskDto> CreateAsync(CreateTaskDto dto);
    Task<TaskDto?> UpdateAsync(int id, UpdateTaskDto dto);
    Task<bool> SoftDeleteAsync(int id);
    Task<IEnumerable<TaskDto>> SearchAsync(string? title, short? status, short? priority, int? projectId, int? tagId);
}
