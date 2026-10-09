import { z } from "zod";
import { WidgetDefinition } from "../../../types/widget";
import { providerFetch, ProviderNotConnectedError } from "../../oauth/credentials";

const configSchema = z.object({
  number: z.number().int().min(1).max(25),
});

type Config = z.infer<typeof configSchema>;

interface CalendarEvent {
  id: string;
  summary?: string;
  htmlLink: string;
  location?: string;
  // dateTime for timed events, date (YYYY-MM-DD) for all-day ones
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export const calendarEventsWidget: WidgetDefinition<Config> = {
  name: "calendar_events",
  description: "Display the next events of your Google Calendar",
  params: [{ name: "number", type: "integer" }],
  configSchema,
  defaultRefreshRateSeconds: 600,
  async fetchData(config, credentials) {
    if (!credentials?.accessToken) throw new ProviderNotConnectedError("google");
    const query = new URLSearchParams({
      timeMin: new Date().toISOString(),
      singleEvents: "true", // expand recurring events into their occurrences
      orderBy: "startTime",
      maxResults: String(config.number),
    });
    const result = await providerFetch<{ items?: CalendarEvent[] }>(
      "google",
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${query}`,
      credentials.accessToken
    );
    return {
      events: (result.items ?? []).map((event) => ({
        id: event.id,
        title: event.summary ?? "(No title)",
        url: event.htmlLink,
        location: event.location ?? null,
        start: event.start.dateTime ?? event.start.date ?? null,
        end: event.end.dateTime ?? event.end.date ?? null,
        allDay: !event.start.dateTime,
      })),
    };
  },
};
