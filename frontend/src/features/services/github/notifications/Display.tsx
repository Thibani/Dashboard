import { type WidgetDisplayProps } from "../../../widgets/widget-component-types";
import "../../../../style/Articlelistdisplay.css";
import "../../../../style/OAuthWidgets.css";

interface Notification {
  id: string;
  title: string;
  type: string;
  repository: string;
  url: string;
}

export default function NotificationsDisplay({ data, isLoading, error }: WidgetDisplayProps) {
  if (isLoading) return <p>Loading…</p>;
  if (error) return <p className="widget-error">{error.message}</p>;
  const { notifications } = data as { notifications: Notification[] };
  if (notifications.length === 0) return <p>You're all caught up.</p>;

  return (
    <div>
      <p className="widget-subtitle">{notifications.length} unread</p>
      <ul className="widget-list">
        {notifications.map((n) => (
          <li key={n.id}>
            <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a>
            <p className="widget-meta">{n.repository} · {n.type}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
