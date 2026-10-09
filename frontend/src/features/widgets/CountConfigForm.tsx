import { useEffect } from "react";
import type { WidgetConfigFormComponent, WidgetConfigFormProps } from "./widget-component-types";

/** Config form for widgets whose only param is `number` (how many items to show). */
export function makeCountConfigForm(label: string, max: number, defaultValue: number): WidgetConfigFormComponent {
  return function CountConfigForm({ value, onChange }: WidgetConfigFormProps) {
    useEffect(() => {
      if (value.number === undefined) {
        onChange({ ...value, number: defaultValue });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <label className="field">
        {label}
        <input
          required
          type="number"
          min={1}
          max={max}
          value={(value.number as number) ?? defaultValue}
          onChange={(e) => onChange({ ...value, number: Number(e.target.value) })}
        />
      </label>
    );
  };
}
