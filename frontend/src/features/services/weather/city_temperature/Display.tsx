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
    <div>
      <p className="widget-big-number">{Math.round(weather.temperatureC)}°C</p>
      <p>{weather.city}, {weather.country}</p>
      <p>{weather.precipitationMm} mm precipitation</p>
    </div>
  );
}