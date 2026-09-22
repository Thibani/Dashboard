import { type ComponentType } from "react";

export interface WidgetDisplayProps {
  data: unknown;
  isLoading: boolean;
  error: Error | null;
}

export interface WidgetConfigFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export type WidgetDisplayComponent = ComponentType<WidgetDisplayProps>;
export type WidgetConfigFormComponent = ComponentType<WidgetConfigFormProps>;