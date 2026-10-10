import { articleListWidget } from "../services/rss/widgets/article-list";
import { safeFetchText } from "../services/safe-fetch";
import { UnsafeUrlError } from "../validation/ssrf-guard";

jest.mock("../services/safe-fetch");

const FEED = `<?xml version="1.0"?>
<rss version="2.0"><channel><title>Example feed</title>
  <item><title>First</title><link>https://example.com/1</link></item>
  <item><title>Second</title><link>https://example.com/2</link></item>
  <item><title>Third</title><link>https://example.com/3</link></item>
</channel></rss>`;

describe("rss article_list widget", () => {
  it("downloads the feed through safeFetchText and returns the first articles", async () => {
    jest.mocked(safeFetchText).mockResolvedValue(FEED);
    const data = await articleListWidget.fetchData({ link: "https://example.com/rss", number: 2 }, null);

    expect(safeFetchText).toHaveBeenCalledWith("https://example.com/rss");
    expect(data).toMatchObject({
      feedTitle: "Example feed",
      articles: [
        { title: "First", link: "https://example.com/1" },
        { title: "Second", link: "https://example.com/2" },
      ],
    });
  });

  it("refuses a feed on an internal address", async () => {
    jest.mocked(safeFetchText).mockRejectedValue(new UnsafeUrlError("This address is not allowed"));
    await expect(
      articleListWidget.fetchData({ link: "http://postgres:5432", number: 5 }, null)
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });
});
