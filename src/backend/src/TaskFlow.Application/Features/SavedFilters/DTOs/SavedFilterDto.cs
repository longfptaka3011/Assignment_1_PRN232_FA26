namespace TaskFlow.Application.Features.SavedFilters.DTOs;

public class SavedFilterDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FilterQuery { get; set; } = "{}";
    public bool IsFavorite { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
