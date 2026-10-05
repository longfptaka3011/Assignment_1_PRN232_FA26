using TaskTrack.Repo.Models;
using TaskTrack.Repo.Repositories;
using TaskTrack.Service.DTOs;

namespace TaskTrack.Service.Services;

public class TagService : ITagService
{
    private readonly ITagRepository _tagRepo;

    public TagService(ITagRepository tagRepo)
    {
        _tagRepo = tagRepo;
    }

    public async Task<IEnumerable<TagDto>> GetAllAsync()
    {
        var tags = await _tagRepo.GetAllAsync();
        return tags.Select(t => new TagDto
        {
            TagId = t.TagId,
            TagName = t.TagName,
            Color = t.Color
        });
    }

    public async Task<TagDto?> GetByIdAsync(int id)
    {
        var t = await _tagRepo.GetByIdAsync(id);
        if (t == null) return null;

        return new TagDto
        {
            TagId = t.TagId,
            TagName = t.TagName,
            Color = t.Color
        };
    }

    public async Task<TagDto> CreateAsync(CreateTagDto dto)
    {
        var entity = new Tag
        {
            TagName = dto.TagName,
            Color = dto.Color
        };

        var created = await _tagRepo.CreateAsync(entity);
        return new TagDto
        {
            TagId = created.TagId,
            TagName = created.TagName,
            Color = created.Color
        };
    }

    public async Task<TagDto?> UpdateAsync(int id, UpdateTagDto dto)
    {
        var existing = await _tagRepo.GetByIdAsync(id);
        if (existing == null) return null;

        existing.TagName = dto.TagName;
        existing.Color = dto.Color;

        await _tagRepo.UpdateAsync(existing);
        return new TagDto
        {
            TagId = existing.TagId,
            TagName = existing.TagName,
            Color = existing.Color
        };
    }

    public async Task<(bool Success, string? ErrorMessage)> DeleteAsync(int id)
    {
        var existing = await _tagRepo.GetByIdAsync(id);
        if (existing == null)
            return (false, "Tag not found.");

        var isUsed = await _tagRepo.IsUsedByAnyTaskAsync(id);
        if (isUsed)
            return (false, "Cannot delete tag because it is currently assigned to one or more tasks.");

        await _tagRepo.DeleteAsync(existing);
        return (true, null);
    }
}
