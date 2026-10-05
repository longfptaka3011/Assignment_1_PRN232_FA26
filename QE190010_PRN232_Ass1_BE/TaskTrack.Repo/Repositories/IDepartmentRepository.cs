using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Repositories;

public interface IDepartmentRepository
{
    System.Threading.Tasks.Task<IEnumerable<Department>> GetAllActiveAsync();
    System.Threading.Tasks.Task<Department?> GetByIdWithProjectsAsync(int id);
    System.Threading.Tasks.Task<Department?> GetByIdAsync(int id);
    System.Threading.Tasks.Task<Department> CreateAsync(Department department);
    System.Threading.Tasks.Task UpdateAsync(Department department);
    System.Threading.Tasks.Task DeleteAsync(Department department);
    System.Threading.Tasks.Task<bool> HasLinkedProjectsAsync(int departmentId);
    System.Threading.Tasks.Task<IEnumerable<Department>> SearchByNameAsync(string name);
}
