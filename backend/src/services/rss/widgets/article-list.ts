import { z } from "zod";
import Parser from "rss-parser";
import { WidgetDefinition } from "../../../types/widget";

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
    const feed = await parser.parseURL(config.link);
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
