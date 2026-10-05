using TaskTrack.Service.DTOs;

namespace TaskTrack.Service.Services;

public interface IProjectService
{
    Task<IEnumerable<ProjectDto>> GetAllActiveAsync();
    Task<ProjectDetailDto?> GetByIdWithTasksAsync(int id);
    Task<ProjectDto?> GetByIdAsync(int id);
    Task<IEnumerable<ProjectDto>> GetByDepartmentIdAsync(int departmentId);
    Task<ProjectDto> CreateAsync(CreateProjectDto dto);
    Task<ProjectDto?> UpdateAsync(int id, UpdateProjectDto dto);
    Task<(bool Success, string? ErrorMessage)> DeleteAsync(int id);
    Task<IEnumerable<ProjectDto>> SearchAsync(string? name, short? status, int? departmentId);
}
