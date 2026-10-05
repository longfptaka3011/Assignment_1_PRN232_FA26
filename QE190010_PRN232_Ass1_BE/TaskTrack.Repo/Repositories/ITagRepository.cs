using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Repositories;

public interface ITagRepository
{
    System.Threading.Tasks.Task<IEnumerable<Tag>> GetAllAsync();
    System.Threading.Tasks.Task<Tag?> GetByIdAsync(int id);
    System.Threading.Tasks.Task<Tag> CreateAsync(Tag tag);
    System.Threading.Tasks.Task UpdateAsync(Tag tag);
    System.Threading.Tasks.Task DeleteAsync(Tag tag);
    System.Threading.Tasks.Task<bool> IsUsedByAnyTaskAsync(int tagId);
}
