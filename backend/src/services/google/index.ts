import { ServiceDefinition } from "../../types/widget";
import { calendarEventsWidget } from "./widgets/calendar-events";

const googleService: ServiceDefinition = {
  name: "google",
  authType: "oauth2",
  oauthProvider: "google",
  widgets: [calendarEventsWidget],
};

export default googleService;
