export interface WidgetParam {
  name: string;
  type: "string" | "integer";
}

export interface WidgetAbout {
  name: string;
  description: string;
  params: WidgetParam[];
}

export interface ServiceAbout {
  name: string;
  widgets: WidgetAbout[];
}

export interface AboutResponse {
  client: { host: string };
  server: { current_time: number; services: ServiceAbout[] };
}

export interface WidgetInstance {
  id: string;
  service: string;
  widget: string;
  config: Record<string, unknown>;
  refreshRateSeconds: number;
}