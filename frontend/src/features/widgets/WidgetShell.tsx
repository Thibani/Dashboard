import { useWidgetData } from "../../hooks/useWidgetData";
import { getDisplay } from "./registry";
import { type WidgetInstance } from "./types";
import "../../style/WidgetShell.css"

interface WidgetShellProps {
  instance: WidgetInstance;
  onRemove: (id: string) => void;
  onEdit: (instance: WidgetInstance) => void;
  dragHandleProps?: Record<string, unknown>;
}

export function WidgetShell({ instance, onRemove, onEdit, dragHandleProps }: WidgetShellProps) {
  const { data, isLoading, error } = useWidgetData(instance);
  const Display = getDisplay(instance.service, instance.widget);

  return (
    <div className="widget-card">
      <div className="widget-header">
        <span className="widget-drag-handle" {...dragHandleProps}>⠿</span>
        <span className="widget-title">{instance.service} · {instance.widget}</span>
        <div className="widget-actions">
          <button onClick={() => onEdit(instance)} aria-label="Edit widget">⚙</button>
          <button onClick={() => onRemove(instance.id)} aria-label="Remove widget">✕</button>
        </div>
      </div>
      <div className="widget-body">
        {Display ? (
          <Display data={data} isLoading={isLoading} error={error as Error | null} />
        ) : (
          <p className="widget-error">Unknown widget: {instance.service}.{instance.widget}</p>
        )}
      </div>
      <div className="widget-footer">refreshes every {instance.refreshRateSeconds}s</div>
    </div>
  );
}