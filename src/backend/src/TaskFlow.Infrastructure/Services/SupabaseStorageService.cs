using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TaskFlow.Application.Common.Interfaces;

namespace TaskFlow.Infrastructure.Services;

public class SupabaseStorageService : ISupabaseStorageService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SupabaseStorageService> _logger;

    public SupabaseStorageService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<SupabaseStorageService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> GetSignedUrlAsync(string bucket, string path, int expiresInSeconds = 3600)
    {
        var supabaseUrl = _configuration["Supabase:Url"]?.TrimEnd('/');
        var serviceKey = _configuration["Supabase:ServiceRoleKey"];

        if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(serviceKey))
        {
            _logger.LogWarning("Supabase Url or ServiceRoleKey not configured, returning mock signed URL.");
            return $"{supabaseUrl}/storage/v1/object/public/{bucket}/{path}";
        }

        var endpoint = $"{supabaseUrl}/storage/v1/object/sign/{bucket}/{path}";
        var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(
                JsonSerializer.Serialize(new { expiresIn = expiresInSeconds }),
                Encoding.UTF8,
                "application/json")
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", serviceKey);
        request.Headers.Add("apikey", serviceKey);

        var response = await _httpClient.SendAsync(request);
        if (response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            if (doc.RootElement.TryGetProperty("signedURL", out var signedUrlElement))
            {
                var relativeSignedUrl = signedUrlElement.GetString();
                return $"{supabaseUrl}/storage/v1{relativeSignedUrl}";
            }
        }

        _logger.LogError("Failed to get signed URL from Supabase Storage: {StatusCode}", response.StatusCode);
        return $"{supabaseUrl}/storage/v1/object/public/{bucket}/{path}";
    }

    public async Task DeleteFileAsync(string bucket, string path)
    {
        var supabaseUrl = _configuration["Supabase:Url"]?.TrimEnd('/');
        var serviceKey = _configuration["Supabase:ServiceRoleKey"];

        if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(serviceKey)) return;

        var endpoint = $"{supabaseUrl}/storage/v1/object/{bucket}/{path}";
        var request = new HttpRequestMessage(HttpMethod.Delete, endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", serviceKey);
        request.Headers.Add("apikey", serviceKey);

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Failed to delete object from Supabase Storage: {StatusCode}", response.StatusCode);
        }
    }
}
