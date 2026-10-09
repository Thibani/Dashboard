import { type WidgetDisplayProps } from "../../../widgets/widget-component-types";
import { Octicon, type OcticonName } from "../Octicon";
import { timeAgo } from "../../../../lib/time";
import "../../../../style/GitHubWidgets.css";

interface Notification {
  id: string;
  title: string;
  type: string;
  reason: string;
  repository: string;
  url: string;
  updatedAt: string;
}

// Same icon and color per subject type as the github.com inbox.
const TYPES: Record<string, { icon: OcticonName; className: string }> = {
  Issue: { icon: "issue", className: "gh-open" },
  PullRequest: { icon: "pullRequest", className: "gh-open" },
  Release: { icon: "tag", className: "gh-muted" },
  Discussion: { icon: "discussion", className: "gh-done" },
  Commit: { icon: "commit", className: "gh-muted" },
  CheckSuite: { icon: "check", className: "gh-open" },
};

export default function NotificationsDisplay({ data, isLoading, error }: WidgetDisplayProps) {
  if (isLoading) return <p className="gh-muted">Loading…</p>;
  if (error) return <p className="widget-error">{error.message}</p>;
  const { notifications } = data as { notifications: Notification[] };

  if (notifications.length === 0) {
    return (
      <div className="gh gh-blankslate">
        <Octicon name="bell" className="gh-blankslate-icon" />
        <p className="gh-blankslate-title">All caught up!</p>
        <p className="gh-muted">Take a break, write some code, do what you do best.</p>
      </div>
    );
  }

  return (
    <div className="gh">
      <p className="gh-box-title">
        Inbox <span className="gh-counter">{notifications.length}</span>
      </p>
      <ul className="gh-list">
        {notifications.map((n) => {
          const type = TYPES[n.type] ?? { icon: "bell" as const, className: "gh-muted" };
          return (
            <li key={n.id} className="gh-notification">
              <Octicon name={type.icon} className={type.className} />
              <div className="gh-notification-body">
                <p className="gh-notification-repo">{n.repository}</p>
                <a className="gh-notification-title" href={n.url} target="_blank" rel="noreferrer">
                  {n.title}
                </a>
                <p className="gh-notification-reason">{n.reason.replace(/_/g, " ")}</p>
              </div>
              <time className="gh-notification-time" dateTime={n.updatedAt}>
                {timeAgo(n.updatedAt)}
              </time>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
