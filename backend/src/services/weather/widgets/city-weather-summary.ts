import { z } from "zod";
import { WidgetDefinition } from "../../../types/widget";

const configSchema = z.object({
  city: z.string().min(1),
});

type Config = z.infer<typeof configSchema>;

interface GeocodingResult {
  results?: {
    latitude: number;
    longitude: number;
    name: string;
    country: string;
  }[];
}

interface ForecastResult {
  current: {
    temperature_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
}

export const cityWeatherSummaryWidget: WidgetDefinition<Config> = {
  name: "city_weather_summary",
  description: "Display a weather summary for a city",
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
      `https://api.open-meteo.com/v1/forecast?latitude=${match.latitude}&longitude=${match.longitude}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=1&timezone=auto`
    ).then((r) => r.json())) as ForecastResult;

    return {
      city: match.name,
      country: match.country,

      temperatureC: forecast.current.temperature_2m,
      precipitationMm: forecast.current.precipitation,
      weatherCode: forecast.current.weather_code,
      windSpeedKmh: forecast.current.wind_speed_10m,

      minTemperatureC: forecast.daily.temperature_2m_min[0],
      maxTemperatureC: forecast.daily.temperature_2m_max[0],
      precipitationProbability: forecast.daily.precipitation_probability_max[0],
    };
  },
};