using TaskTrack.Service.DTOs;

namespace TaskTrack.Service.Services;

public interface ITagService
{
    Task<IEnumerable<TagDto>> GetAllAsync();
    Task<TagDto?> GetByIdAsync(int id);
    Task<TagDto> CreateAsync(CreateTagDto dto);
    Task<TagDto?> UpdateAsync(int id, UpdateTagDto dto);
    Task<(bool Success, string? ErrorMessage)> DeleteAsync(int id);
}
