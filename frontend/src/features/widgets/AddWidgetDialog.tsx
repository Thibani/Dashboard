import { useState, type SyntheticEvent } from "react";
import { type AboutResponse, type WidgetInstance } from "./types";
import { getConfigForm } from "./registry";
import { validateConfig } from "./validate-config";
import { ServiceIcon } from "../../components/ServiceIcon";
import { useConnections, useServiceProvider } from "../../hooks/useOAuth";
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
  const [error, setError] = useState<string | null>(null);

  const provider = useServiceProvider(serviceName);
  const connections = useConnections();
  const needsConnection =
    provider && connections.data && !connections.data.some((c) => c.provider === provider.name && !c.needsReconnect);

  const ConfigForm = widget ? getConfigForm(serviceName, widgetName) : undefined;

  function handleServiceChange(name: string) {
    setServiceName(name);
    const nextService = about.server.services.find((s) => s.name === name);
    setWidgetName(nextService?.widgets[0]?.name ?? "");
    setConfig({});
    setError(null);
  }

  function handleConfigChange(next: Record<string, unknown>) {
    setConfig(next);
    setError(null);
  }

  // A widget is only added once its parameters are valid: otherwise the
  // server refuses to save it and the widget can only show an error.
  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!widget) return;

    const check = validateConfig(widget.params, config);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    // Rules of the inputs themselves (type="url", min/max...).
    const invalid = e.currentTarget.querySelector<HTMLInputElement>("input:invalid, select:invalid");
    if (invalid) {
      const label = invalid.closest("label")?.childNodes[0]?.textContent?.trim();
      setError(`${label ? `${label}: ` : ""}${invalid.validationMessage || "invalid value."}`);
      invalid.focus();
      return;
    }

    onConfirm({
      id: editingInstance?.id ?? crypto.randomUUID(),
      service: serviceName,
      widget: widgetName,
      config: check.config,
      refreshRateSeconds: refreshRate,
    });
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form className="dialog" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} noValidate>
        <h2>{editingInstance ? "Edit widget" : "Add widget"}</h2>

        <label className="field">
          Service
          <span className="field-with-icon">
            <ServiceIcon service={serviceName} size={20} />
            <select value={serviceName} onChange={(e) => handleServiceChange(e.target.value)} disabled={!!editingInstance}>
              {about.server.services.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </span>
        </label>

        <label className="field">
          Widget
          <select value={widgetName} onChange={(e) => { setWidgetName(e.target.value); setConfig({}); setError(null); }} disabled={!!editingInstance}>
            {service?.widgets.map((w) => <option key={w.name} value={w.name}>{w.name}</option>)}
          </select>
        </label>

        {widget && <p className="field-hint">{widget.description}</p>}
        {needsConnection && (
          <p className="field-hint">
            Needs your {provider.label} account: the widget will ask you to connect it.
          </p>
        )}

        {ConfigForm ? <ConfigForm value={config} onChange={handleConfigChange} /> : <p className="widget-error">No config form for this widget yet.</p>}

        <label className="field">
          Refresh rate (seconds)
          <input
            type="number"
            min={10}
            max={86400}
            value={refreshRate}
            onChange={(e) => { setRefreshRate(Number(e.target.value)); setError(null); }}
          />
        </label>

        {error && <p className="widget-error" role="alert">{error}</p>}

        <div className="dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={!ConfigForm}>{editingInstance ? "Save" : "Add to dashboard"}</button>
        </div>
      </form>
    </div>
  );
}