import { ServiceDefinition } from "../../types/widget";
import { notificationsWidget } from "./widgets/notifications";
import { repositoriesWidget } from "./widgets/repositories";

const githubService: ServiceDefinition = {
  name: "github",
  authType: "oauth2",
  oauthProvider: "github",
  widgets: [repositoriesWidget, notificationsWidget],
};

export default githubService;
