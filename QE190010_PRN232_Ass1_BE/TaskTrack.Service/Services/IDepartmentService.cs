using TaskTrack.Service.DTOs;

namespace TaskTrack.Service.Services;

public interface IDepartmentService
{
    Task<IEnumerable<DepartmentDto>> GetAllActiveAsync();
    Task<DepartmentDetailDto?> GetByIdWithProjectsAsync(int id);
    Task<DepartmentDto?> GetByIdAsync(int id);
    Task<DepartmentDto> CreateAsync(CreateDepartmentDto dto);
    Task<DepartmentDto?> UpdateAsync(int id, UpdateDepartmentDto dto);
    Task<(bool Success, string? ErrorMessage)> DeleteAsync(int id);
    Task<IEnumerable<DepartmentDto>> SearchByNameAsync(string name);
}
