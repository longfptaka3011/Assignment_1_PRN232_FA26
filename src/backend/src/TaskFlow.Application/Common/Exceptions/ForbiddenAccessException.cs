namespace TaskFlow.Application.Common.Exceptions;

public class ForbiddenAccessException : Exception
{
    public ForbiddenAccessException() : base("You do not have permission to access or perform this operation on this resource.") { }

    public ForbiddenAccessException(string message) : base(message) { }
}
