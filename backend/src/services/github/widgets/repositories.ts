import { z } from "zod";
import { WidgetDefinition } from "../../../types/widget";
import { providerFetch, ProviderNotConnectedError } from "../../oauth/credentials";

const configSchema = z.object({
  number: z.number().int().min(1).max(30),
});

type Config = z.infer<typeof configSchema>;

interface GithubRepo {
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  private: boolean;
}

export const repositoriesWidget: WidgetDefinition<Config> = {
  name: "repositories",
  description: "Display your most recently updated GitHub repositories",
  params: [{ name: "number", type: "integer" }],
  configSchema,
  defaultRefreshRateSeconds: 900,
  async fetchData(config, credentials) {
    if (!credentials?.accessToken) throw new ProviderNotConnectedError("github");
    const repos = await providerFetch<GithubRepo[]>(
      "github",
      `https://api.github.com/user/repos?sort=pushed&affiliation=owner&per_page=${config.number}`,
      credentials.accessToken
    );
    return {
      repositories: repos.map((repo) => ({
        name: repo.full_name,
        url: repo.html_url,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        pushedAt: repo.pushed_at,
        private: repo.private,
      })),
    };
  },
};
