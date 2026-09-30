import { type WidgetDisplayProps } from "../../../widgets/widget-component-types";
import "../../../../style/CityWeatherDetailedDisplay.css";

interface HourlyWeather {
  time: string;
  temperatureC: number;
  precipitationProbability: number;
  precipitationMm: number;
  weatherCode: number;
  windSpeedKmh: number;
}

interface DailyWeather {
  date: string;
  weatherCode: number;
  minTemperatureC: number;
  maxTemperatureC: number;
  precipitationMm: number;
  precipitationProbability: number;
}

interface WeatherData {
  city: string;
  country: string;

  current: {
    temperatureC: number;
    humidity: number;
    apparentTemperatureC: number;
    precipitationMm: number;
    weatherCode: number;
    windSpeedKmh: number;
    windDirection: number;
  };

  hourly: HourlyWeather[];

  daily: DailyWeather[];
}

function getWeatherDescription(code: number): string {
  if (code === 0) return "Clear sky";

  if ([1, 2, 3].includes(code)) {
    return "Cloudy";
  }

  if ([45, 48].includes(code)) {
    return "Fog";
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return "Drizzle";
  }

  if ([61, 63, 65, 66, 67].includes(code)) {
    return "Rain";
  }

  if ([71, 73, 75, 77].includes(code)) {
    return "Snow";
  }

  if ([80, 81, 82].includes(code)) {
    return "Rain showers";
  }

  if ([85, 86].includes(code)) {
    return "Snow showers";
  }

  if ([95, 96, 99].includes(code)) {
    return "Thunderstorm";
  }

  return "Unknown";
}

function getWeatherIcon(code: number): string {
  if (code === 0) return "☀️";

  if ([1, 2].includes(code)) {
    return "🌤️";
  }

  if (code === 3) {
    return "☁️";
  }

  if ([45, 48].includes(code)) {
    return "🌫️";
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return "🌦️";
  }

  if ([61, 63, 65, 66, 67].includes(code)) {
    return "🌧️";
  }

  if ([71, 73, 75, 77].includes(code)) {
    return "🌨️";
  }

  if ([80, 81, 82].includes(code)) {
    return "🌦️";
  }

  if ([85, 86].includes(code)) {
    return "🌨️";
  }

  if ([95, 96, 99].includes(code)) {
    return "⛈️";
  }

  return "🌡️";
}

function formatHour(time: string): string {
  return new Date(time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getWindDirection(degrees: number): string {
  const directions = [
    "N",
    "NE",
    "E",
    "SE",
    "S",
    "SW",
    "W",
    "NW",
  ];

  const index = Math.round(degrees / 45) % 8;

  return directions[index];
}

export default function CityWeatherDetailedDisplay({
  data,
  isLoading,
  error,
}: WidgetDisplayProps) {
  if (isLoading) {
    return <p>Loading…</p>;
  }

  if (error) {
    return <p className="widget-error">{error.message}</p>;
  }

  const weather = data as WeatherData;

  return (
    <div className="weather-detailed">
      {/* Header */}
      <div className="weather-header">
        <div>
          <h2>
            {weather.city}, {weather.country}
          </h2>

          <p>
            {getWeatherDescription(weather.current.weatherCode)}
          </p>
        </div>

        <div className="weather-current-temperature">
          {getWeatherIcon(weather.current.weatherCode)}
          <span>
            {Math.round(weather.current.temperatureC)}°C
          </span>
        </div>
      </div>

      {/* Current conditions */}
      <div className="weather-current">
        <div className="weather-stat">
          <span className="weather-stat-label">
            Feels like
          </span>

          <span className="weather-stat-value">
            {Math.round(weather.current.apparentTemperatureC)}°C
          </span>
        </div>

        <div className="weather-stat">
          <span className="weather-stat-label">
            Humidity
          </span>

          <span className="weather-stat-value">
            {weather.current.humidity}%
          </span>
        </div>

        <div className="weather-stat">
          <span className="weather-stat-label">
            Rain
          </span>

          <span className="weather-stat-value">
            {weather.current.precipitationMm} mm
          </span>
        </div>

        <div className="weather-stat">
          <span className="weather-stat-label">
            Wind
          </span>

          <span className="weather-stat-value">
            {Math.round(weather.current.windSpeedKmh)} km/h{" "}
            {getWindDirection(weather.current.windDirection)}
          </span>
        </div>
      </div>

      {/* Hourly forecast */}
      <section className="weather-section">
        <h3>Next 24 hours</h3>

        <div className="weather-hourly">
          {weather.hourly.map((hour) => (
            <div
              className="weather-hour"
              key={hour.time}
            >
              <span className="weather-hour-time">
                {formatHour(hour.time)}
              </span>

              <span className="weather-hour-icon">
                {getWeatherIcon(hour.weatherCode)}
              </span>

              <span className="weather-hour-temperature">
                {Math.round(hour.temperatureC)}°
              </span>

              <span className="weather-hour-rain">
                {hour.precipitationProbability}%
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Daily forecast */}
      <section className="weather-section">
        <h3>7-day forecast</h3>

        <div className="weather-daily">
          {weather.daily.map((day) => (
            <div
              className="weather-day"
              key={day.date}
            >
              <span className="weather-day-date">
                {formatDate(day.date)}
              </span>

              <span className="weather-day-icon">
                {getWeatherIcon(day.weatherCode)}
              </span>

              <span className="weather-day-description">
                {getWeatherDescription(day.weatherCode)}
              </span>

              <span className="weather-day-temperature">
                {Math.round(day.minTemperatureC)}° /{" "}
                {Math.round(day.maxTemperatureC)}°
              </span>

              <span className="weather-day-rain">
                {day.precipitationProbability}% ·{" "}
                {day.precipitationMm} mm
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}