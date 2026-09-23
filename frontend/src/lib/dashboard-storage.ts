import { type WidgetInstance } from "../features/widgets/types";

const STORAGE_KEY = "dashboard.widget-instances";

export function loadInstances(): WidgetInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveInstances(instances: WidgetInstance[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(instances));
}