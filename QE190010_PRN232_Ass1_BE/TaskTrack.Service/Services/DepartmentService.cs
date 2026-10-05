using TaskTrack.Repo.Models;
using TaskTrack.Repo.Repositories;
using TaskTrack.Service.DTOs;

namespace TaskTrack.Service.Services;

public class DepartmentService : IDepartmentService
{
    private readonly IDepartmentRepository _deptRepo;

    public DepartmentService(IDepartmentRepository deptRepo)
    {
        _deptRepo = deptRepo;
    }

    public async Task<IEnumerable<DepartmentDto>> GetAllActiveAsync()
    {
        var depts = await _deptRepo.GetAllActiveAsync();
        return depts.Select(d => new DepartmentDto
        {
            DepartmentId = d.DepartmentId,
            DepartmentName = d.DepartmentName,
            DepartmentDescription = d.DepartmentDescription,
            IsActive = d.IsActive
        });
    }

    public async Task<DepartmentDetailDto?> GetByIdWithProjectsAsync(int id)
    {
        var dept = await _deptRepo.GetByIdWithProjectsAsync(id);
        if (dept == null) return null;

        return new DepartmentDetailDto
        {
            DepartmentId = dept.DepartmentId,
            DepartmentName = dept.DepartmentName,
            DepartmentDescription = dept.DepartmentDescription,
            IsActive = dept.IsActive,
            Projects = dept.Projects.Select(p => new ProjectDto
            {
                ProjectId = p.ProjectId,
                ProjectName = p.ProjectName,
                Description = p.Description,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                Status = p.Status,
                DepartmentId = p.DepartmentId,
                DepartmentName = dept.DepartmentName,
                IsActive = p.IsActive,
                CreatedDate = p.CreatedDate
            }).ToList()
        };
    }

    public async Task<DepartmentDto?> GetByIdAsync(int id)
    {
        var dept = await _deptRepo.GetByIdAsync(id);
        if (dept == null) return null;

        return new DepartmentDto
        {
            DepartmentId = dept.DepartmentId,
            DepartmentName = dept.DepartmentName,
            DepartmentDescription = dept.DepartmentDescription,
            IsActive = dept.IsActive
        };
    }

    public async Task<DepartmentDto> CreateAsync(CreateDepartmentDto dto)
    {
        var entity = new Department
        {
            DepartmentName = dto.DepartmentName,
            DepartmentDescription = dto.DepartmentDescription,
            IsActive = dto.IsActive
        };

        var created = await _deptRepo.CreateAsync(entity);
        return new DepartmentDto
        {
            DepartmentId = created.DepartmentId,
            DepartmentName = created.DepartmentName,
            DepartmentDescription = created.DepartmentDescription,
            IsActive = created.IsActive
        };
    }

    public async Task<DepartmentDto?> UpdateAsync(int id, UpdateDepartmentDto dto)
    {
        var dept = await _deptRepo.GetByIdAsync(id);
        if (dept == null) return null;

        dept.DepartmentName = dto.DepartmentName;
        dept.DepartmentDescription = dto.DepartmentDescription;
        dept.IsActive = dto.IsActive;

        await _deptRepo.UpdateAsync(dept);
        return new DepartmentDto
        {
            DepartmentId = dept.DepartmentId,
            DepartmentName = dept.DepartmentName,
            DepartmentDescription = dept.DepartmentDescription,
            IsActive = dept.IsActive
        };
    }

    public async Task<(bool Success, string? ErrorMessage)> DeleteAsync(int id)
    {
        var dept = await _deptRepo.GetByIdAsync(id);
        if (dept == null)
            return (false, "Department not found.");

        var hasLinkedProjects = await _deptRepo.HasLinkedProjectsAsync(id);
        if (hasLinkedProjects)
            return (false, "Cannot delete department because one or more projects are linked to it.");

        await _deptRepo.DeleteAsync(dept);
        return (true, null);
    }

    public async Task<IEnumerable<DepartmentDto>> SearchByNameAsync(string name)
    {
        var depts = await _deptRepo.SearchByNameAsync(name);
        return depts.Select(d => new DepartmentDto
        {
            DepartmentId = d.DepartmentId,
            DepartmentName = d.DepartmentName,
            DepartmentDescription = d.DepartmentDescription,
            IsActive = d.IsActive
        });
    }
}
