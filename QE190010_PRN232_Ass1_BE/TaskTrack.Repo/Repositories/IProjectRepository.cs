using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Repositories;

public interface IProjectRepository
{
    System.Threading.Tasks.Task<IEnumerable<Project>> GetAllActiveAsync();
    System.Threading.Tasks.Task<Project?> GetByIdWithTasksAsync(int id);
    System.Threading.Tasks.Task<Project?> GetByIdAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<Project>> GetByDepartmentIdAsync(int departmentId);
    System.Threading.Tasks.Task<Project> CreateAsync(Project project);
    System.Threading.Tasks.Task UpdateAsync(Project project);
    System.Threading.Tasks.Task DeleteAsync(Project project);
    System.Threading.Tasks.Task<bool> HasLinkedTasksAsync(int projectId);
    System.Threading.Tasks.Task<IEnumerable<Project>> SearchAsync(string? name, short? status, int? departmentId);
}
