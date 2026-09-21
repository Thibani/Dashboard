import { ServiceDefinition } from "../../types/widget";
import { articleListWidget } from "./widgets/article-list";

const rssService: ServiceDefinition = {
  name: "rss",
  authType: "none",
  widgets: [articleListWidget],
};

export default rssService;
