using TaskFlow.Application.Common.Utilities;
using Xunit;

namespace TaskFlow.Application.UnitTests;

public class LexoRankTests
{
    [Fact]
    public void Between_WhenBothNull_ShouldReturnDefaultRank()
    {
        var result = LexoRank.Between(null, null);
        Assert.Equal(LexoRank.DefaultRank, result);
    }

    [Fact]
    public void Between_WhenOnlyNextProvided_ShouldReturnRankBeforeNext()
    {
        var next = "0|hzzzzz:";
        var result = LexoRank.Between(null, next);

        Assert.True(string.CompareOrdinal(result, next) < 0, $"Expected {result} < {next}");
    }

    [Fact]
    public void Between_WhenOnlyPrevProvided_ShouldReturnRankAfterPrev()
    {
        var prev = "0|100000:";
        var result = LexoRank.Between(prev, null);

        Assert.True(string.CompareOrdinal(result, prev) > 0, $"Expected {result} > {prev}");
    }

    [Fact]
    public void Between_WhenBothProvided_ShouldReturnRankBetweenThem()
    {
        var prev = "0|100000:";
        var next = "0|200000:";
        var mid = LexoRank.Between(prev, next);

        Assert.True(string.CompareOrdinal(prev, mid) < 0, $"Expected {prev} < {mid}");
        Assert.True(string.CompareOrdinal(mid, next) < 0, $"Expected {mid} < {next}");
    }

    [Fact]
    public void Between_MultipleInsertionsInMiddle_ShouldMaintainStrictAscendingOrder()
    {
        var item1 = "0|100000:";
        var item3 = "0|200000:";

        // Insert item2 between 1 and 3
        var item2 = LexoRank.Between(item1, item3);

        // Insert item1_5 between 1 and 2
        var item1_5 = LexoRank.Between(item1, item2);

        // Insert item2_5 between 2 and 3
        var item2_5 = LexoRank.Between(item2, item3);

        var list = new List<string> { item1, item1_5, item2, item2_5, item3 };
        var sorted = list.OrderBy(x => x, StringComparer.Ordinal).ToList();

        Assert.Equal(list, sorted);
    }
}
