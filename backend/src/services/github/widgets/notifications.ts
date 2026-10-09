import { z } from "zod";
import { WidgetDefinition } from "../../../types/widget";
import { providerFetch, ProviderNotConnectedError } from "../../oauth/credentials";

const configSchema = z.object({
  number: z.number().int().min(1).max(50),
});

type Config = z.infer<typeof configSchema>;

// The API gives API urls (api.github.com/repos/o/r/pulls/12); the browser
// page is the same path on github.com, with "pull" instead of "pulls".
function webUrl(apiUrl: string | null, fallback: string): string {
  const match = apiUrl?.match(/^https:\/\/api\.github\.com\/repos\/([^/]+\/[^/]+)\/(issues|pulls|commits|releases)\/([^/]+)$/);
  if (!match) return fallback;
  const [, repo, kind, id] = match;
  const page = kind === "pulls" ? "pull" : kind === "commits" ? "commit" : kind;
  // Release API urls end with a numeric id, which has no web page: use the list.
  return kind === "releases" ? `https://github.com/${repo}/releases` : `https://github.com/${repo}/${page}/${id}`;
}

interface GithubNotification {
  id: string;
  reason: string;
  updated_at: string;
  subject: { title: string; type: string; url: string | null };
  repository: { full_name: string; html_url: string };
}

export const notificationsWidget: WidgetDefinition<Config> = {
  name: "notifications",
  description: "Display your unread GitHub notifications",
  params: [{ name: "number", type: "integer" }],
  configSchema,
  defaultRefreshRateSeconds: 300,
  async fetchData(config, credentials) {
    if (!credentials?.accessToken) throw new ProviderNotConnectedError("github");
    const notifications = await providerFetch<GithubNotification[]>(
      "github",
      `https://api.github.com/notifications?per_page=${config.number}`,
      credentials.accessToken
    );
    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.subject.title,
        type: n.subject.type,
        reason: n.reason,
        repository: n.repository.full_name,
        url: webUrl(n.subject.url, n.repository.html_url),
        updatedAt: n.updated_at,
      })),
    };
  },
};
