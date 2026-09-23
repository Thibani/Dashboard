import { type WidgetConfigFormProps } from "../../../widgets/widget-component-types";
import "../../../../style/Citytemperatureconfigform.css"

export default function CityTemperatureConfigForm({ value, onChange }: WidgetConfigFormProps) {
  return (
    <label className="field">
      City
      <input
        type="text"
        value={(value.city as string) ?? ""}
        onChange={(e) => onChange({ ...value, city: e.target.value })}
        placeholder="Strasbourg"
      />
    </label>
  );
}