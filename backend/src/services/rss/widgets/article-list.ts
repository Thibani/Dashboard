import { z } from "zod";
import Parser from "rss-parser";
import { WidgetDefinition } from "../../../types/widget";
import { safeFetchText } from "../../safe-fetch";

const configSchema = z.object({
  link: z.string().url(),
  number: z.number().int().min(1).max(50),
});

type Config = z.infer<typeof configSchema>;

const parser = new Parser();

export const articleListWidget: WidgetDefinition<Config> = {
  name: "article_list",
  description: "Displaying the list of the last articles",
  params: [
    { name: "link", type: "string" },
    { name: "number", type: "integer" },
  ],
  configSchema,
  defaultRefreshRateSeconds: 900,
  async fetchData(config) {
    // Not parser.parseURL(): the link comes from the user, so it is downloaded
    // through safeFetchText, which refuses internal addresses.
    const feed = await parser.parseString(await safeFetchText(config.link));
    return {
      feedTitle: feed.title,
      articles: (feed.items ?? []).slice(0, config.number).map((item) => ({
        title: item.title,
        link: item.link,
        publishedAt: item.pubDate,
      })),
    };
  },
};
