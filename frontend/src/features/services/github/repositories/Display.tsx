import { type WidgetDisplayProps } from "../../../widgets/widget-component-types";
import { Octicon } from "../Octicon";
import { timeAgo } from "../../../../lib/time";
import "../../../../style/GitHubWidgets.css";

interface Repository {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  pushedAt: string;
  private: boolean;
}

// The colors github.com uses for the most common languages.
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#663399",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Dart: "#00B4AB",
  Haskell: "#5e5086",
  Astro: "#ff5a03",
  Vue: "#41b883",
  Makefile: "#427819",
};

export default function RepositoriesDisplay({ data, isLoading, error }: WidgetDisplayProps) {
  if (isLoading) return <p className="gh-muted">Loading…</p>;
  if (error) return <p className="widget-error">{error.message}</p>;
  const { repositories } = data as { repositories: Repository[] };
  if (repositories.length === 0) return <p className="gh-blankslate">You don't have any repositories yet.</p>;

  return (
    <ul className="gh gh-list">
      {repositories.map((repo) => {
        const [owner, name] = repo.name.split("/");
        return (
          <li key={repo.name} className="gh-repo">
            <div className="gh-repo-head">
              <Octicon name={repo.private ? "lock" : "repo"} className="gh-muted" />
              <a className="gh-repo-name" href={repo.url} target="_blank" rel="noreferrer">
                {owner}/<strong>{name}</strong>
              </a>
              <span className="gh-label">{repo.private ? "Private" : "Public"}</span>
            </div>
            {repo.description && <p className="gh-repo-description">{repo.description}</p>}
            <div className="gh-repo-meta">
              {repo.language && (
                <span>
                  <span className="gh-language-dot" style={{ background: LANGUAGE_COLORS[repo.language] ?? "#8b949e" }} />
                  {repo.language}
                </span>
              )}
              <span>
                <Octicon name="star" />
                {repo.stars}
              </span>
              {repo.pushedAt && <span>Updated {timeAgo(repo.pushedAt)}</span>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
