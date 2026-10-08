export type ParamType = "string" | "integer";

export interface WidgetParam {
  name: string;
  type: ParamType;
}

export interface WidgetDefinition {
  name: string;
  description: string;
  params: WidgetParam[];
}

export interface ServiceDefinition {
  name: string;
  widgets: WidgetDefinition[];
}

export const services: ServiceDefinition[] = [
  {
    name: "weather",
    widgets: [
      {
        name: "city_temperature",
        description: "Display temperature for a city",
        params: [{ name: "city", type: "string" }],
      },
      {
          name: "city_meto_summary",
          description: "Display a weather summary for a city",
          params: [{ name: "city", type: "string" }],
      },
      {
          name: "city_weather_detailed",
          description: "Display detailed weather information for a city",
          params: [{ name: "city", type: "string" }],
      },
    ],
  },
  {
    name: "rss",
    widgets: [
      {
        name: "article_list",
        description: "Displaying the list of the last articles",
        params: [
          { name: "link", type: "string" },
          { name: "number", type: "integer" },
        ],
      },
    ],
  },
];

export function findWidget(service: string, widget: string): WidgetDefinition | undefined {
  return services.find((s) => s.name === service)?.widgets.find((w) => w.name === widget);
}