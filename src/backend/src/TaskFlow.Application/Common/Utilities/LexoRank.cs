using System.Text;

namespace TaskFlow.Application.Common.Utilities;

/// <summary>
/// Simple and robust LexoRank implementation for card and backlog ordering.
/// LexoRank generates orderable alphanumeric string keys (e.g. "0|hzzzzz:").
/// </summary>
public static class LexoRank
{
    private const string BaseBucket = "0|";
    private const string Suffix = ":";
    private const string Digits = "0123456789abcdefghijklmnopqrstuvwxyz";
    private const char MinChar = '0';
    private const char MaxChar = 'z';
    private const char MidChar = 'h';
    public const string DefaultRank = "0|hzzzzz:";

    public static string Between(string? prev, string? next)
    {
        var prevClean = Clean(prev);
        var nextClean = Clean(next);

        if (string.IsNullOrEmpty(prevClean) && string.IsNullOrEmpty(nextClean))
        {
            return DefaultRank;
        }

        if (string.IsNullOrEmpty(prevClean))
        {
            // Position before nextClean
            return BaseBucket + GetBefore(nextClean) + Suffix;
        }

        if (string.IsNullOrEmpty(nextClean))
        {
            // Position after prevClean
            return BaseBucket + GetAfter(prevClean) + Suffix;
        }

        // Compare
        if (string.CompareOrdinal(prevClean, nextClean) >= 0)
        {
            // Invalid order passed, append after prevClean
            return BaseBucket + GetAfter(prevClean) + Suffix;
        }

        return BaseBucket + GetMidpoint(prevClean, nextClean) + Suffix;
    }

    private static string Clean(string? rank)
    {
        if (string.IsNullOrWhiteSpace(rank)) return string.Empty;

        var val = rank.Trim();
        if (val.StartsWith(BaseBucket))
        {
            val = val.Substring(BaseBucket.Length);
        }
        else if (val.Length >= 2 && val[1] == '|')
        {
            val = val.Substring(2);
        }

        if (val.EndsWith(Suffix))
        {
            val = val.Substring(0, val.Length - Suffix.Length);
        }

        return val;
    }

    private static string GetBefore(string next)
    {
        var sb = new StringBuilder();
        for (int i = 0; i < next.Length; i++)
        {
            char c = next[i];
            int index = Digits.IndexOf(c);
            if (index > 0)
            {
                // Can decrease
                int mid = index / 2;
                sb.Append(Digits[mid]);
                return sb.ToString();
            }
            sb.Append(MinChar);
        }
        sb.Append(MidChar);
        return sb.ToString();
    }

    private static string GetAfter(string prev)
    {
        var sb = new StringBuilder();
        bool incremented = false;

        for (int i = 0; i < prev.Length; i++)
        {
            char c = prev[i];
            int index = Digits.IndexOf(c);
            if (!incremented && index < Digits.Length - 1)
            {
                int mid = (index + Digits.Length) / 2;
                sb.Append(Digits[mid]);
                incremented = true;
                break;
            }
            sb.Append(c);
        }

        if (!incremented)
        {
            sb.Append(MidChar);
        }

        return sb.ToString();
    }

    private static string GetMidpoint(string prev, string next)
    {
        var sb = new StringBuilder();
        int maxLen = Math.Max(prev.Length, next.Length);

        for (int i = 0; i < maxLen; i++)
        {
            char p = i < prev.Length ? prev[i] : MinChar;
            char n = i < next.Length ? next[i] : MaxChar;

            int pIdx = Digits.IndexOf(p);
            int nIdx = Digits.IndexOf(n);

            if (pIdx < 0) pIdx = 0;
            if (nIdx < 0) nIdx = Digits.Length - 1;

            if (pIdx == nIdx)
            {
                sb.Append(p);
                continue;
            }

            if (nIdx - pIdx > 1)
            {
                int mid = (pIdx + nIdx) / 2;
                sb.Append(Digits[mid]);
                return sb.ToString();
            }

            // Consecutive digits (e.g. 'a' and 'b'), we append p and look to the next position
            sb.Append(p);
            // In the next position, prev character effectively becomes what remains of prev (or MinChar),
            // and next character effectively becomes MaxChar + 1
            var nextPrevPart = i + 1 < prev.Length ? prev.Substring(i + 1) : "";
            sb.Append(GetAfter(nextPrevPart));
            return sb.ToString();
        }

        sb.Append(MidChar);
        return sb.ToString();
    }
}
