using TaskTrack.Repo.Models;
using TaskEntity = TaskTrack.Repo.Models.Task;

namespace TaskTrack.Repo.Repositories;

public interface ITaskRepository
{
    System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetAllActiveAsync();
    System.Threading.Tasks.Task<TaskEntity?> GetByIdWithTagsAsync(int id);
    System.Threading.Tasks.Task<TaskEntity?> GetByIdAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetByProjectIdAsync(int projectId);
    System.Threading.Tasks.Task<TaskEntity> CreateAsync(TaskEntity task, IEnumerable<int>? tagIds);
    System.Threading.Tasks.Task UpdateAsync(TaskEntity task, IEnumerable<int>? tagIds);
    System.Threading.Tasks.Task SoftDeleteAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<TaskEntity>> SearchAsync(string? title, short? status, short? priority, int? projectId, int? tagId);
}
