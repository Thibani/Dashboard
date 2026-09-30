import { ServiceDefinition } from "../../types/widget";
import { cityTemperatureWidget } from "./widgets/city-temperature";
import { cityWeatherDetailedWidget } from "./widgets/city-weather-detailed";
import { cityWeatherSummaryWidget } from "./widgets/city-weather-summary";

const weatherService: ServiceDefinition = {
  name: "weather",
  authType: "none",
  widgets: [cityTemperatureWidget, cityWeatherDetailedWidget, cityWeatherSummaryWidget],
};

export default weatherService;
