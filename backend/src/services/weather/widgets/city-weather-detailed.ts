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
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };

  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    wind_speed_10m: number[];
  };

  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
  };
}

export const cityWeatherDetailedWidget: WidgetDefinition<Config> = {
  name: "city_weather_detailed",
  description: "Display detailed weather information for a city",
  params: [{ name: "city", type: "string" }],
  configSchema,
  defaultRefreshRateSeconds: 600,

  async fetchData(config) {
    // Get city coordinates
    const geo = (await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        config.city
      )}&count=1`
    ).then((r) => r.json())) as GeocodingResult;

    const match = geo.results?.[0];

    if (!match) {
      throw new Error(`City not found: ${config.city}`);
    }

    // Get weather data
    const forecast = (await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${match.latitude}` +
        `&longitude=${match.longitude}` +
        `&current=` +
        `temperature_2m,` +
        `relative_humidity_2m,` +
        `apparent_temperature,` +
        `precipitation,` +
        `weather_code,` +
        `wind_speed_10m,` +
        `wind_direction_10m` +
        `&hourly=` +
        `temperature_2m,` +
        `precipitation_probability,` +
        `precipitation,` +
        `weather_code,` +
        `wind_speed_10m` +
        `&daily=` +
        `weather_code,` +
        `temperature_2m_max,` +
        `temperature_2m_min,` +
        `precipitation_sum,` +
        `precipitation_probability_max` +
        `&forecast_days=7` +
        `&timezone=auto`
    ).then((r) => r.json())) as ForecastResult;

    // Keep only the next 24 hours
    const hourly = forecast.hourly.time
      .map((time, index) => ({
        time,
        temperatureC: forecast.hourly.temperature_2m[index],
        precipitationProbability:
          forecast.hourly.precipitation_probability[index],
        precipitationMm: forecast.hourly.precipitation[index],
        weatherCode: forecast.hourly.weather_code[index],
        windSpeedKmh: forecast.hourly.wind_speed_10m[index],
      }))
      .slice(0, 24);

    // Format daily forecast
    const daily = forecast.daily.time.map((date, index) => ({
      date,
      weatherCode: forecast.daily.weather_code[index],
      minTemperatureC: forecast.daily.temperature_2m_min[index],
      maxTemperatureC: forecast.daily.temperature_2m_max[index],
      precipitationMm: forecast.daily.precipitation_sum[index],
      precipitationProbability:
        forecast.daily.precipitation_probability_max[index],
    }));

    return {
      city: match.name,
      country: match.country,

      current: {
        temperatureC: forecast.current.temperature_2m,
        humidity: forecast.current.relative_humidity_2m,
        apparentTemperatureC: forecast.current.apparent_temperature,
        precipitationMm: forecast.current.precipitation,
        weatherCode: forecast.current.weather_code,
        windSpeedKmh: forecast.current.wind_speed_10m,
        windDirection: forecast.current.wind_direction_10m,
      },

      hourly,

      daily,
    };
  },
};