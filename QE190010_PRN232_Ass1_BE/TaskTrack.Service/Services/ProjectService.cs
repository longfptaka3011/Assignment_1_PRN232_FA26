using TaskTrack.Repo.Models;
using TaskTrack.Repo.Repositories;
using TaskTrack.Service.DTOs;

namespace TaskTrack.Service.Services;

public class ProjectService : IProjectService
{
    private readonly IProjectRepository _projRepo;
    private readonly IDepartmentRepository _deptRepo;

    public ProjectService(IProjectRepository projRepo, IDepartmentRepository deptRepo)
    {
        _projRepo = projRepo;
        _deptRepo = deptRepo;
    }

    public async Task<IEnumerable<ProjectDto>> GetAllActiveAsync()
    {
        var projects = await _projRepo.GetAllActiveAsync();
        return projects.Select(p => MapToDto(p));
    }

    public async Task<ProjectDetailDto?> GetByIdWithTasksAsync(int id)
    {
        var p = await _projRepo.GetByIdWithTasksAsync(id);
        if (p == null) return null;

        return new ProjectDetailDto
        {
            ProjectId = p.ProjectId,
            ProjectName = p.ProjectName,
            Description = p.Description,
            StartDate = p.StartDate,
            EndDate = p.EndDate,
            Status = p.Status,
            DepartmentId = p.DepartmentId,
            DepartmentName = p.Department?.DepartmentName,
            IsActive = p.IsActive,
            CreatedDate = p.CreatedDate,
            Tasks = p.Tasks.Select(t => new TaskDto
            {
                TaskId = t.TaskId,
                Title = t.Title,
                Description = t.Description,
                Status = t.Status,
                Priority = t.Priority,
                DueDate = t.DueDate,
                ProjectId = t.ProjectId,
                ProjectName = p.ProjectName,
                IsActive = t.IsActive,
                CreatedDate = t.CreatedDate,
                ModifiedDate = t.ModifiedDate,
                Tags = t.Tags.Select(tg => new TagDto
                {
                    TagId = tg.TagId,
                    TagName = tg.TagName,
                    Color = tg.Color
                }).ToList()
            }).ToList()
        };
    }

    public async Task<ProjectDto?> GetByIdAsync(int id)
    {
        var p = await _projRepo.GetByIdAsync(id);
        if (p == null) return null;
        return MapToDto(p);
    }

    public async Task<IEnumerable<ProjectDto>> GetByDepartmentIdAsync(int departmentId)
    {
        var projects = await _projRepo.GetByDepartmentIdAsync(departmentId);
        return projects.Select(p => MapToDto(p));
    }

    public async Task<ProjectDto> CreateAsync(CreateProjectDto dto)
    {
        var dept = await _deptRepo.GetByIdAsync(dto.DepartmentId);
        if (dept == null)
            throw new ArgumentException($"Department with ID {dto.DepartmentId} does not exist.");

        var entity = new Project
        {
            ProjectName = dto.ProjectName,
            Description = dto.Description,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Status = dto.Status,
            DepartmentId = dto.DepartmentId,
            IsActive = dto.IsActive,
            CreatedDate = DateTime.UtcNow
        };

        var created = await _projRepo.CreateAsync(entity);
        var refreshed = await _projRepo.GetByIdAsync(created.ProjectId);
        return MapToDto(refreshed ?? created);
    }

    public async Task<ProjectDto?> UpdateAsync(int id, UpdateProjectDto dto)
    {
        var existing = await _projRepo.GetByIdAsync(id);
        if (existing == null) return null;

        var dept = await _deptRepo.GetByIdAsync(dto.DepartmentId);
        if (dept == null)
            throw new ArgumentException($"Department with ID {dto.DepartmentId} does not exist.");

        existing.ProjectName = dto.ProjectName;
        existing.Description = dto.Description;
        existing.StartDate = dto.StartDate;
        existing.EndDate = dto.EndDate;
        existing.Status = dto.Status;
        existing.DepartmentId = dto.DepartmentId;
        existing.IsActive = dto.IsActive;

        await _projRepo.UpdateAsync(existing);
        var refreshed = await _projRepo.GetByIdAsync(id);
        return MapToDto(refreshed ?? existing);
    }

    public async Task<(bool Success, string? ErrorMessage)> DeleteAsync(int id)
    {
        var existing = await _projRepo.GetByIdAsync(id);
        if (existing == null)
            return (false, "Project not found.");

        var hasLinkedTasks = await _projRepo.HasLinkedTasksAsync(id);
        if (hasLinkedTasks)
            return (false, "Cannot delete project because one or more tasks are linked to it.");

        await _projRepo.DeleteAsync(existing);
        return (true, null);
    }

    public async Task<IEnumerable<ProjectDto>> SearchAsync(string? name, short? status, int? departmentId)
    {
        var projects = await _projRepo.SearchAsync(name, status, departmentId);
        return projects.Select(p => MapToDto(p));
    }

    private static ProjectDto MapToDto(Project p)
    {
        return new ProjectDto
        {
            ProjectId = p.ProjectId,
            ProjectName = p.ProjectName,
            Description = p.Description,
            StartDate = p.StartDate,
            EndDate = p.EndDate,
            Status = p.Status,
            DepartmentId = p.DepartmentId,
            DepartmentName = p.Department?.DepartmentName,
            IsActive = p.IsActive,
            CreatedDate = p.CreatedDate
        };
    }
}
