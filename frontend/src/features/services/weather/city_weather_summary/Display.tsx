import { type WidgetDisplayProps } from "../../../widgets/widget-component-types";
import "../../../../style/Cityweathersummarydisplay.css";

interface WeatherData {
  city: string;
  country: string;
  temperatureC: number;
  precipitationMm: number;
  weatherCode: number;
  windSpeedKmh: number;
  minTemperatureC: number;
  maxTemperatureC: number;
  precipitationProbability: number;
}

function getWeatherDescription(code: number): string {
  if (code === 0) return "Clear sky";
  if ([1, 2, 3].includes(code)) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Rain showers";
  if ([85, 86].includes(code)) return "Snow showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";

  return "Unknown";
}

export default function CityWeatherSummaryDisplay({
  data,
  isLoading,
  error,
}: WidgetDisplayProps) {
  if (isLoading) return <p>Loading…</p>;
  if (error) return <p className="widget-error">{error.message}</p>;

  const weather = data as WeatherData;

  return (
    <div className="city-weather-summary">
      <div className="city-weather-summary-header">
        <div className="city-weather-summary-location">
          <p className="city-weather-summary-city">
            {weather.city}
          </p>

          <p className="city-weather-summary-country">
            {weather.country}
          </p>
        </div>

        <div className="city-weather-summary-temperature">
          {Math.round(weather.temperatureC)}°C
        </div>
      </div>

      <div className="city-weather-summary-condition">
        {getWeatherDescription(weather.weatherCode)}
      </div>

      <div className="city-weather-summary-range">
        <span className="city-weather-summary-range-label">
          Today:
        </span>

        <span>
          {Math.round(weather.minTemperatureC)}°C
          {" – "}
          {Math.round(weather.maxTemperatureC)}°C
        </span>
      </div>

      <div className="city-weather-summary-stats">
        <div className="city-weather-summary-stat">
          <span className="city-weather-summary-stat-label">
            Rain probability
          </span>

          <span className="city-weather-summary-stat-value">
            {weather.precipitationProbability}%
          </span>
        </div>

        <div className="city-weather-summary-stat">
          <span className="city-weather-summary-stat-label">
            Precipitation
          </span>

          <span className="city-weather-summary-stat-value">
            {weather.precipitationMm} mm
          </span>
        </div>

        <div className="city-weather-summary-stat">
          <span className="city-weather-summary-stat-label">
            Wind
          </span>

          <span className="city-weather-summary-stat-value">
            {Math.round(weather.windSpeedKmh)} km/h
          </span>
        </div>
      </div>
    </div>
  );
}