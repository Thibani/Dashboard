import { type WidgetDisplayProps } from "../../../widgets/widget-component-types";
import "../../../../style/Citytemperaturedisplay.css"

interface WeatherData {
  city: string;
  country: string;
  temperatureC: number;
  precipitationMm: number;
}

export default function CityTemperatureDisplay({ data, isLoading, error }: WidgetDisplayProps) {
  if (isLoading) return <p>Loading…</p>;
  if (error) return <p className="widget-error">{error.message}</p>;
  const weather = data as WeatherData;
  return (
    <div className="city-temperature">
      <p className="widget-big-number">{Math.round(weather.temperatureC)}°C</p>
      <p className="city-temperature-place">{weather.city}, {weather.country}</p>
      <p className="city-temperature-detail">{weather.precipitationMm} mm precipitation</p>
    </div>
  );
}