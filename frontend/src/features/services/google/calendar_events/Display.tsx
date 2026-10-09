import { type WidgetDisplayProps } from "../../../widgets/widget-component-types";
import "../../../../style/GoogleWidgets.css";

interface CalendarEvent {
  id: string;
  title: string;
  url: string;
  location: string | null;
  start: string | null;
  end?: string | null;
  allDay: boolean;
}

// All-day events are a plain date (YYYY-MM-DD): parse it as local, not UTC.
function toDate(value: string, allDay: boolean) {
  return allDay ? new Date(`${value}T00:00:00`) : new Date(value);
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

// Agenda view: one block per day, like Google Calendar's "Schedule".
function groupByDay(events: CalendarEvent[]) {
  const days: { date: Date; events: CalendarEvent[] }[] = [];
  for (const event of events) {
    if (!event.start) continue;
    const date = toDate(event.start, event.allDay);
    const last = days[days.length - 1];
    if (last && dayKey(last.date) === dayKey(date)) last.events.push(event);
    else days.push({ date, events: [event] });
  }
  return days;
}

export default function CalendarEventsDisplay({ data, isLoading, error }: WidgetDisplayProps) {
  if (isLoading) return <p className="gcal-muted">Loading…</p>;
  if (error) return <p className="widget-error">{error.message}</p>;
  const { events } = data as { events: CalendarEvent[] };

  if (events.length === 0) {
    return (
      <div className="gcal gcal-empty">
        <p className="gcal-empty-title">Nothing planned</p>
        <p className="gcal-muted">You have no upcoming events.</p>
      </div>
    );
  }

  const today = dayKey(new Date());

  return (
    <div className="gcal">
      {groupByDay(events).map(({ date, events: dayEvents }) => (
        <section key={dayKey(date)} className="gcal-day">
          <div className={`gcal-date${dayKey(date) === today ? " gcal-today" : ""}`}>
            <span className="gcal-weekday">{date.toLocaleDateString(undefined, { weekday: "short" })}</span>
            <span className="gcal-daynum">{date.getDate()}</span>
            <span className="gcal-month">{date.toLocaleDateString(undefined, { month: "short" })}</span>
          </div>
          <ul className="gcal-events">
            {dayEvents.map((event) => {
              const start = toDate(event.start as string, event.allDay);
              const end = event.end && !event.allDay ? new Date(event.end) : null;
              return (
                <li key={event.id}>
                  <a
                    className={`gcal-event${event.allDay ? " gcal-event-allday" : ""}`}
                    href={event.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {!event.allDay && <span className="gcal-event-dot" />}
                    <span className="gcal-event-text">
                      <span className="gcal-event-title">{event.title}</span>
                      <span className="gcal-event-detail">
                        {event.allDay ? "All day" : end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start)}
                        {event.location && ` · ${event.location}`}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
