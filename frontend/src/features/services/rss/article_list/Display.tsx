import { type WidgetDisplayProps } from "../../../widgets/widget-component-types";
import "../../../../style/Articlelistdisplay.css"

interface Article { title: string; link: string; publishedAt: string; }
interface RssData { feedTitle: string; articles: Article[]; }

export default function ArticleListDisplay({ data, isLoading, error }: WidgetDisplayProps) {
  if (isLoading) return <p>Loading…</p>;
  if (error) return <p className="widget-error">{error.message}</p>;
  const rss = data as RssData;
  return (
    <div>
      <p className="widget-subtitle">{rss.feedTitle}</p>
      <ul className="widget-list">
        {rss.articles.map((a) => (
          <li key={a.link}><a href={a.link} target="_blank" rel="noreferrer">{a.title}</a></li>
        ))}
      </ul>
    </div>
  );
}