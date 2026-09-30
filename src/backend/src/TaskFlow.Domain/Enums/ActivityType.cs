namespace TaskFlow.Domain.Enums;

public enum ActivityType
{
    Created = 1,
    Updated = 2,
    StatusChanged = 3,
    Assigned = 4,
    SprintChanged = 5,
    PriorityChanged = 6,
    CommentAdded = 7,
    AttachmentAdded = 8,
    AttachmentRemoved = 9,
    CommentRemoved = 10,
    Deleted = 11
}
