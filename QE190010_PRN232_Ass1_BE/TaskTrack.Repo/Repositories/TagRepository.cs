using Microsoft.EntityFrameworkCore;
using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Repositories;

public class TagRepository : ITagRepository
{
    private readonly TaskTrackDbContext _context;

    public TagRepository(TaskTrackDbContext context)
    {
        _context = context;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Tag>> GetAllAsync()
    {
        return await _context.Tags
            .OrderBy(t => t.TagId)
            .ToListAsync();
    }

    public async System.Threading.Tasks.Task<Tag?> GetByIdAsync(int id)
    {
        return await _context.Tags.FindAsync(id);
    }

    public async System.Threading.Tasks.Task<Tag> CreateAsync(Tag tag)
    {
        _context.Tags.Add(tag);
        await _context.SaveChangesAsync();
        return tag;
    }

    public async System.Threading.Tasks.Task UpdateAsync(Tag tag)
    {
        _context.Tags.Update(tag);
        await _context.SaveChangesAsync();
    }

    public async System.Threading.Tasks.Task DeleteAsync(Tag tag)
    {
        _context.Tags.Remove(tag);
        await _context.SaveChangesAsync();
    }

    public async System.Threading.Tasks.Task<bool> IsUsedByAnyTaskAsync(int tagId)
    {
        return await _context.Tasks.AnyAsync(t => t.Tags.Any(tg => tg.TagId == tagId));
    }
}
