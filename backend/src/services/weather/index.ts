import { ServiceDefinition } from "../../types/widget";
import { cityTemperatureWidget } from "./widgets/city-temperature";

const weatherService: ServiceDefinition = {
  name: "weather",
  authType: "none",
  widgets: [cityTemperatureWidget],
};

export default weatherService;
