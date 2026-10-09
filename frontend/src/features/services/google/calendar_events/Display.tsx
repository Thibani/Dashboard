import { type WidgetDisplayProps } from "../../../widgets/widget-component-types";
import "../../../../style/Articlelistdisplay.css";
import "../../../../style/OAuthWidgets.css";

interface CalendarEvent {
  id: string;
  title: string;
  url: string;
  location: string | null;
  start: string | null;
  allDay: boolean;
}

function formatStart(event: CalendarEvent) {
  if (!event.start) return "";
  // All-day events are a plain date (YYYY-MM-DD): parse it as local, not UTC.
  const date = event.allDay ? new Date(`${event.start}T00:00:00`) : new Date(event.start);
  return event.allDay
    ? `${date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · all day`
    : date.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function CalendarEventsDisplay({ data, isLoading, error }: WidgetDisplayProps) {
  if (isLoading) return <p>Loading…</p>;
  if (error) return <p className="widget-error">{error.message}</p>;
  const { events } = data as { events: CalendarEvent[] };
  if (events.length === 0) return <p>No upcoming events.</p>;

  return (
    <ul className="widget-list">
      {events.map((event) => (
        <li key={event.id}>
          <a href={event.url} target="_blank" rel="noreferrer">{event.title}</a>
          <p className="widget-meta">
            {formatStart(event)}
            {event.location && ` · ${event.location}`}
          </p>
        </li>
      ))}
    </ul>
  );
}
