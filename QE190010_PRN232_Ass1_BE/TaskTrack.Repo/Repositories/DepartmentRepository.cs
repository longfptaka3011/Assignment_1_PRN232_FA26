using Microsoft.EntityFrameworkCore;
using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Repositories;

public class DepartmentRepository : IDepartmentRepository
{
    private readonly TaskTrackDbContext _context;

    public DepartmentRepository(TaskTrackDbContext context)
    {
        _context = context;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Department>> GetAllActiveAsync()
    {
        return await _context.Departments
            .Where(d => d.IsActive)
            .OrderBy(d => d.DepartmentId)
            .ToListAsync();
    }

    public async System.Threading.Tasks.Task<Department?> GetByIdWithProjectsAsync(int id)
    {
        return await _context.Departments
            .Include(d => d.Projects.Where(p => p.IsActive))
            .FirstOrDefaultAsync(d => d.DepartmentId == id);
    }

    public async System.Threading.Tasks.Task<Department?> GetByIdAsync(int id)
    {
        return await _context.Departments.FindAsync(id);
    }

    public async System.Threading.Tasks.Task<Department> CreateAsync(Department department)
    {
        _context.Departments.Add(department);
        await _context.SaveChangesAsync();
        return department;
    }

    public async System.Threading.Tasks.Task UpdateAsync(Department department)
    {
        _context.Departments.Update(department);
        await _context.SaveChangesAsync();
    }

    public async System.Threading.Tasks.Task DeleteAsync(Department department)
    {
        _context.Departments.Remove(department);
        await _context.SaveChangesAsync();
    }

    public async System.Threading.Tasks.Task<bool> HasLinkedProjectsAsync(int departmentId)
    {
        return await _context.Projects.AnyAsync(p => p.DepartmentId == departmentId);
    }

    public async System.Threading.Tasks.Task<IEnumerable<Department>> SearchByNameAsync(string name)
    {
        return await _context.Departments
            .Where(d => d.IsActive && EF.Functions.ILike(d.DepartmentName, $"%{name}%"))
            .OrderBy(d => d.DepartmentName)
            .ToListAsync();
    }
}
