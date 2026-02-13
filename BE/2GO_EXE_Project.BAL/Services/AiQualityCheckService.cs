using System.Net.Http.Headers;
using System.IO;
using System.Text;
using System.Linq;
using System.Text.RegularExpressions;
using _2GO_EXE_Project.BAL.DTOs.Ai;
using _2GO_EXE_Project.BAL.Interfaces;
using _2GO_EXE_Project.DAL.Entities;
using _2GO_EXE_Project.DAL.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace _2GO_EXE_Project.BAL.Services;

public class AiQualityCheckService : IAiQualityCheckService
{
    private const int MinResolution = 300;
    private const int MaxBytesToRead = 64 * 1024;
    private const int MaxVisionChecks = 2;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IGeminiService _geminiService;
    private readonly IUnitOfWork _uow;

    public AiQualityCheckService(IHttpClientFactory httpClientFactory, IGeminiService geminiService, IUnitOfWork uow)
    {
        _httpClientFactory = httpClientFactory;
        _geminiService = geminiService;
        _uow = uow;
    }

    public async Task<AiQualityResult> CheckAsync(IReadOnlyList<string> mediaUrls, CancellationToken cancellationToken = default)
    {
        var issues = new List<string>();
        var score = 1.0;
        var hasUnknownResolution = false;

        if (mediaUrls == null || mediaUrls.Count == 0)
        {
            return new AiQualityResult(0, new[] { "No media provided." }, "REJECT");
        }

        if (mediaUrls.Count < 2)
        {
            score -= 0.1;
            issues.Add("Only 1 media item provided.");
        }

        foreach (var url in mediaUrls)
        {
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
            {
                hasUnknownResolution = true;
                issues.Add("Invalid media URL.");
                continue;
            }

            var info = await TryGetImageInfoAsync(uri, cancellationToken);
            if (!info.IsImage)
            {
                score -= 0.4;
                issues.Add("Media is not a valid image.");
                continue;
            }

            if (!info.ContentLength.HasValue)
            {
                hasUnknownResolution = true;
                issues.Add("Cannot verify content length.");
            }

            if (!info.Width.HasValue || !info.Height.HasValue)
            {
                hasUnknownResolution = true;
                issues.Add("Cannot verify image resolution.");
                continue;
            }

            if (info.Width.Value < MinResolution || info.Height.Value < MinResolution)
            {
                score -= 0.4;
                issues.Add($"Image resolution too low: {info.Width.Value}x{info.Height.Value}.");
            }
        }

        // Gemini Vision assessment (best-effort, limited images to control quota)
        var visionScores = new List<int>();
        var visionChecks = mediaUrls.Take(MaxVisionChecks).ToList();
        foreach (var url in visionChecks)
        {
            var vision = await TryGeminiVisionAsync(url, cancellationToken);
            if (vision.HasValue)
            {
                visionScores.Add(vision.Value.Score);
            }
        }

        if (visionScores.Count > 0)
        {
            var avg = (int)Math.Round(visionScores.Average(), 0);
            issues.Add($"Gemini image quality avg: {avg}/10 (n={visionScores.Count}).");
            if (avg <= 4)
            {
                score = Math.Min(score, 0.4);
            }
            else if (avg <= 6)
            {
                score -= 0.2;
            }
        }

        // Gemini Vision damage check (best-effort, single image)
        if (mediaUrls.Count > 0)
        {
            var damage = await TryGeminiDamageAsync(mediaUrls[0], cancellationToken);
            if (!string.IsNullOrWhiteSpace(damage))
            {
                issues.Add($"Possible damage: {damage}");
                score -= 0.1;
            }
        }

        score = Math.Clamp(score, 0, 1);
        var decision = score >= 0.75 ? "PASS"
            : score >= 0.45 ? "MANUAL_REVIEW"
            : "REJECT";

        return new AiQualityResult(score, issues, decision);
    }

    private async Task UpsertCacheAsync(string imageUrl, Action<AiImageVisionCache> update, CancellationToken cancellationToken)
    {
        var existing = await _uow.AiImageVisionCaches.Query().FirstOrDefaultAsync(x => x.ImageUrl == imageUrl, cancellationToken);
        if (existing == null)
        {
            var cache = new AiImageVisionCache
            {
                ImageUrl = imageUrl,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            update(cache);
            await _uow.AiImageVisionCaches.AddAsync(cache, cancellationToken);
        }
        else
        {
            update(existing);
            existing.UpdatedAt = DateTime.UtcNow;
            _uow.AiImageVisionCaches.Update(existing);
        }
        await _uow.SaveChangesAsync(cancellationToken);
    }

        private async Task<(int Score, string Raw)?> TryGeminiVisionAsync(string imageUrl, CancellationToken cancellationToken)
    {
        try
        {
            var cached = await _uow.AiImageVisionCaches.Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.ImageUrl == imageUrl, cancellationToken);
            if (cached?.QualityScore != null)
            {
                return (cached.QualityScore.Value, cached.RawResponse ?? string.Empty);
            }

            var prompt =
                "Danh gia chat luong anh san pham (ro net/anh sang) tren thang diem 1-10. " +
                "Chi tra ve diem dang so va mot cau ngan ly do.";
            var text = await _geminiService.GenerateFromImageAsync(prompt, imageUrl, null, cancellationToken);
            if (string.IsNullOrWhiteSpace(text)) return null;

            var match = Regex.Match(text, @"\b(10|[1-9])\b");
            if (!match.Success) return null;
            var score = int.Parse(match.Value);
            await UpsertCacheAsync(imageUrl, cache =>
            {
                cache.QualityScore = score;
                cache.RawResponse = text.Trim();
            }, cancellationToken);
            return (score, text);
        }
        catch
        {
            return null;
        }
    }

        private async Task<string?> TryGeminiDamageAsync(string imageUrl, CancellationToken cancellationToken)
    {
        try
        {
            var cached = await _uow.AiImageVisionCaches.Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.ImageUrl == imageUrl, cancellationToken);
            if (!string.IsNullOrWhiteSpace(cached?.DamageLabels))
            {
                return string.Equals(cached.DamageLabels, "none", StringComparison.OrdinalIgnoreCase)
                    ? null
                    : cached.DamageLabels;
            }

            var prompt =
                "Kiem tra be mat san pham trong anh va liet ke cac dau hieu hu hong neu co. " +
                "Tra ve danh sach ngan, phan tach bang dau phay. " +
                "Neu khong thay, tra loi 'none'. Vi du: tray xuoc, bong troc, nut vo, loi man hinh, meo moc, o xy hoa.";
            var text = await _geminiService.GenerateFromImageAsync(prompt, imageUrl, null, cancellationToken);
            if (string.IsNullOrWhiteSpace(text)) return null;
            var normalized = text.Trim().ToLowerInvariant();
            var label = normalized.Contains("none") ? "none" : text.Trim();
            await UpsertCacheAsync(imageUrl, cache =>
            {
                cache.DamageLabels = label;
                if (string.IsNullOrWhiteSpace(cache.RawResponse))
                {
                    cache.RawResponse = text.Trim();
                }
            }, cancellationToken);
            return label == "none" ? null : label;
        }
        catch
        {
            return null;
        }
    }

    private async Task<ImageInfo> TryGetImageInfoAsync(Uri uri, CancellationToken cancellationToken)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            using var request = new HttpRequestMessage(HttpMethod.Head, uri);
            request.Headers.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36");
            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return await TryGetImageInfoByGetAsync(client, uri, cancellationToken);
            }

            var contentType = response.Content.Headers.ContentType?.MediaType;
            if (string.IsNullOrWhiteSpace(contentType) || !contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            {
                return new ImageInfo(false, null, null, null);
            }

            return await TryGetImageInfoByGetAsync(client, uri, cancellationToken);
        }
        catch
        {
            return new ImageInfo(false, null, null, null);
        }
    }

    private static async Task<ImageInfo> TryGetImageInfoByGetAsync(HttpClient client, Uri uri, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, uri);
        request.Headers.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36");
        request.Headers.Range = new RangeHeaderValue(0, MaxBytesToRead - 1);
        using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return new ImageInfo(false, null, null, null);
        }

        var contentType = response.Content.Headers.ContentType?.MediaType;
        if (string.IsNullOrWhiteSpace(contentType) || !contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            return new ImageInfo(false, null, null, null);
        }

        var contentLength = response.Content.Headers.ContentLength;

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var memory = new MemoryStream();
        var buffer = new byte[8192];
        int read;
        while (memory.Length < MaxBytesToRead &&
               (read = await stream.ReadAsync(buffer.AsMemory(0, Math.Min(buffer.Length, MaxBytesToRead - (int)memory.Length)), cancellationToken)) > 0)
        {
            memory.Write(buffer, 0, read);
        }

        var data = memory.ToArray();
        if (TryReadPng(data, out var pngWidth, out var pngHeight))
        {
            return new ImageInfo(true, pngWidth, pngHeight, contentLength);
        }

        if (TryReadJpeg(data, out var jpgWidth, out var jpgHeight))
        {
            return new ImageInfo(true, jpgWidth, jpgHeight, contentLength);
        }

        return new ImageInfo(true, null, null, contentLength);
    }

    private static bool TryReadPng(byte[] data, out int width, out int height)
    {
        width = 0;
        height = 0;
        if (data.Length < 24) return false;
        var pngSignature = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
        if (!pngSignature.SequenceEqual(data.Take(8))) return false;
        var chunkType = Encoding.ASCII.GetString(data, 12, 4);
        if (chunkType != "IHDR") return false;
        width = ReadInt32BigEndian(data, 16);
        height = ReadInt32BigEndian(data, 20);
        return width > 0 && height > 0;
    }

    private static bool TryReadJpeg(byte[] data, out int width, out int height)
    {
        width = 0;
        height = 0;
        if (data.Length < 4) return false;
        if (data[0] != 0xFF || data[1] != 0xD8) return false;

        var index = 2;
        while (index + 1 < data.Length)
        {
            if (data[index] != 0xFF)
            {
                index++;
                continue;
            }

            var marker = data[index + 1];
            if (marker is 0xC0 or 0xC1 or 0xC2 or 0xC3 or 0xC5 or 0xC6 or 0xC7 or 0xC9 or 0xCA or 0xCB or 0xCD or 0xCE or 0xCF)
            {
                if (index + 8 >= data.Length) return false;
                height = ReadInt16BigEndian(data, index + 5);
                width = ReadInt16BigEndian(data, index + 7);
                return width > 0 && height > 0;
            }

            if (index + 3 >= data.Length) return false;
            var length = ReadInt16BigEndian(data, index + 2);
            if (length <= 0) return false;
            index += 2 + length;
        }

        return false;
    }

    private static int ReadInt32BigEndian(byte[] data, int offset)
        => (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];

    private static int ReadInt16BigEndian(byte[] data, int offset)
        => (data[offset] << 8) | data[offset + 1];

    private sealed record ImageInfo(bool IsImage, int? Width, int? Height, long? ContentLength);
}

