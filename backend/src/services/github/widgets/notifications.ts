import { z } from "zod";
import { WidgetDefinition } from "../../../types/widget";
import { providerFetch, ProviderNotConnectedError } from "../../oauth/credentials";

const configSchema = z.object({
  number: z.number().int().min(1).max(50),
});

type Config = z.infer<typeof configSchema>;

interface GithubNotification {
  id: string;
  reason: string;
  updated_at: string;
  subject: { title: string; type: string };
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
        // The API only gives API urls for the subject; the repo page is the closest browser link.
        url: n.repository.html_url,
        updatedAt: n.updated_at,
      })),
    };
  },
};
