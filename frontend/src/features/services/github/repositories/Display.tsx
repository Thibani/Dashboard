import { type WidgetDisplayProps } from "../../../widgets/widget-component-types";
import "../../../../style/Articlelistdisplay.css";
import "../../../../style/OAuthWidgets.css";

interface Repository {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  private: boolean;
}

export default function RepositoriesDisplay({ data, isLoading, error }: WidgetDisplayProps) {
  if (isLoading) return <p>Loading…</p>;
  if (error) return <p className="widget-error">{error.message}</p>;
  const { repositories } = data as { repositories: Repository[] };
  if (repositories.length === 0) return <p>No repositories yet.</p>;

  return (
    <ul className="widget-list">
      {repositories.map((repo) => (
        <li key={repo.name}>
          <a href={repo.url} target="_blank" rel="noreferrer">{repo.name}</a>
          {repo.private && <span className="widget-tag">private</span>}
          <p className="widget-meta">
            ★ {repo.stars}
            {repo.language && ` · ${repo.language}`}
          </p>
        </li>
      ))}
    </ul>
  );
}
