import { z } from "zod";
import { WidgetDefinition } from "../../../types/widget";

const configSchema = z.object({
  city: z.string().min(1),
});

type Config = z.infer<typeof configSchema>;

interface GeocodingResult {
  results?: { latitude: number; longitude: number; name: string; country: string }[];
}

interface ForecastResult {
  current: {
    temperature_2m: number;
    precipitation: number;
    weather_code: number;
  };
}

export const cityTemperatureWidget: WidgetDefinition<Config> = {
  name: "city_temperature",
  description: "Display temperature for a city",
  params: [{ name: "city", type: "string" }],
  configSchema,
  defaultRefreshRateSeconds: 600,
  async fetchData(config) {
    const geo = (await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(config.city)}&count=1`
    ).then((r) => r.json())) as GeocodingResult;

    const match = geo.results?.[0];
    if (!match) {
      throw new Error(`City not found: ${config.city}`);
    }

    const forecast = (await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${match.latitude}&longitude=${match.longitude}&current=temperature_2m,precipitation,weather_code`
    ).then((r) => r.json())) as ForecastResult;

    return {
      city: match.name,
      country: match.country,
      temperatureC: forecast.current.temperature_2m,
      precipitationMm: forecast.current.precipitation,
      weatherCode: forecast.current.weather_code,
    };
  },
};
