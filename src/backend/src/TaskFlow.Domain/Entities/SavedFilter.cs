using TaskFlow.Domain.Common;

namespace TaskFlow.Domain.Entities;

public class SavedFilter : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public Guid? ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FilterQuery { get; set; } = "{}"; // Stored JSON
    public bool IsFavorite { get; set; }

    public Profile User { get; set; } = null!;
    public Project? Project { get; set; }
}
