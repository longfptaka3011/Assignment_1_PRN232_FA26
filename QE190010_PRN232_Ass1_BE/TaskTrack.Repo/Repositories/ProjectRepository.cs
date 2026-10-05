using Microsoft.EntityFrameworkCore;
using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Repositories;

public class ProjectRepository : IProjectRepository
{
    private readonly TaskTrackDbContext _context;

    public ProjectRepository(TaskTrackDbContext context)
    {
        _context = context;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Project>> GetAllActiveAsync()
    {
        return await _context.Projects
            .Include(p => p.Department)
            .Where(p => p.IsActive)
            .OrderBy(p => p.ProjectId)
            .ToListAsync();
    }

    public async System.Threading.Tasks.Task<Project?> GetByIdWithTasksAsync(int id)
    {
        return await _context.Projects
            .Include(p => p.Department)
            .Include(p => p.Tasks.Where(t => t.IsActive))
                .ThenInclude(t => t.Tags)
            .FirstOrDefaultAsync(p => p.ProjectId == id);
    }

    public async System.Threading.Tasks.Task<Project?> GetByIdAsync(int id)
    {
        return await _context.Projects
            .Include(p => p.Department)
            .FirstOrDefaultAsync(p => p.ProjectId == id);
    }

    public async System.Threading.Tasks.Task<IEnumerable<Project>> GetByDepartmentIdAsync(int departmentId)
    {
        return await _context.Projects
            .Include(p => p.Department)
            .Where(p => p.DepartmentId == departmentId && p.IsActive)
            .OrderBy(p => p.ProjectId)
            .ToListAsync();
    }

    public async System.Threading.Tasks.Task<Project> CreateAsync(Project project)
    {
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();
        return project;
    }

    public async System.Threading.Tasks.Task UpdateAsync(Project project)
    {
        _context.Projects.Update(project);
        await _context.SaveChangesAsync();
    }

    public async System.Threading.Tasks.Task DeleteAsync(Project project)
    {
        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();
    }

    public async System.Threading.Tasks.Task<bool> HasLinkedTasksAsync(int projectId)
    {
        return await _context.Tasks.AnyAsync(t => t.ProjectId == projectId);
    }

    public async System.Threading.Tasks.Task<IEnumerable<Project>> SearchAsync(string? name, short? status, int? departmentId)
    {
        var query = _context.Projects
            .Include(p => p.Department)
            .Where(p => p.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(name))
        {
            query = query.Where(p => EF.Functions.ILike(p.ProjectName, $"%{name}%"));
        }

        if (status.HasValue)
        {
            query = query.Where(p => p.Status == status.Value);
        }

        if (departmentId.HasValue)
        {
            query = query.Where(p => p.DepartmentId == departmentId.Value);
        }

        return await query.OrderBy(p => p.ProjectId).ToListAsync();
    }
}
