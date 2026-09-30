namespace TaskFlow.Application.Common.Interfaces;

public interface ISupabaseStorageService
{
    Task<string> GetSignedUrlAsync(string bucket, string path, int expiresInSeconds = 3600);
    Task DeleteFileAsync(string bucket, string path);
}
