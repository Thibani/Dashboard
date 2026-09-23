import { useState } from "react";
import { type AboutResponse, type WidgetInstance } from "./types";
import { getConfigForm } from "./registry";
import "../../style/AddWidgetDialog.css"

interface AddWidgetDialogProps {
  about: AboutResponse;
  editingInstance?: WidgetInstance;
  onConfirm: (instance: WidgetInstance) => void;
  onClose: () => void;
}

export function AddWidgetDialog({ about, editingInstance, onConfirm, onClose }: AddWidgetDialogProps) {
  const [serviceName, setServiceName] = useState(editingInstance?.service ?? about.server.services[0]?.name ?? "");
  const service = about.server.services.find((s) => s.name === serviceName);
  const [widgetName, setWidgetName] = useState(editingInstance?.widget ?? service?.widgets[0]?.name ?? "");
  const widget = service?.widgets.find((w) => w.name === widgetName);
  const [config, setConfig] = useState<Record<string, unknown>>(editingInstance?.config ?? {});
  const [refreshRate, setRefreshRate] = useState(editingInstance?.refreshRateSeconds ?? 300);

  const ConfigForm = widget ? getConfigForm(serviceName, widgetName) : undefined;

  function handleServiceChange(name: string) {
    setServiceName(name);
    const nextService = about.server.services.find((s) => s.name === name);
    setWidgetName(nextService?.widgets[0]?.name ?? "");
    setConfig({});
  }

  function handleSubmit() {
    if (!widget) return;
    onConfirm({
      id: editingInstance?.id ?? crypto.randomUUID(),
      service: serviceName,
      widget: widgetName,
      config,
      refreshRateSeconds: refreshRate,
    });
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2>{editingInstance ? "Edit widget" : "Add widget"}</h2>

        <label className="field">
          Service
          <select value={serviceName} onChange={(e) => handleServiceChange(e.target.value)} disabled={!!editingInstance}>
            {about.server.services.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        </label>

        <label className="field">
          Widget
          <select value={widgetName} onChange={(e) => { setWidgetName(e.target.value); setConfig({}); }} disabled={!!editingInstance}>
            {service?.widgets.map((w) => <option key={w.name} value={w.name}>{w.name}</option>)}
          </select>
        </label>

        {widget && <p className="field-hint">{widget.description}</p>}

        {ConfigForm ? <ConfigForm value={config} onChange={setConfig} /> : <p className="widget-error">No config form for this widget yet.</p>}

        <label className="field">
          Refresh rate (seconds)
          <input type="number" min={10} value={refreshRate} onChange={(e) => setRefreshRate(Number(e.target.value))} />
        </label>

        <div className="dialog-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSubmit} disabled={!ConfigForm}>{editingInstance ? "Save" : "Add to dashboard"}</button>
        </div>
      </div>
    </div>
  );
}