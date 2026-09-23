import { useEffect } from "react";
import type { WidgetConfigFormProps } from "../../../widgets/widget-component-types";
import "../../../../style/Articlelistconfigform.css"

export default function ArticleListConfigForm({ value, onChange }: WidgetConfigFormProps) {
  useEffect(() => {
    if (value.number === undefined) {
      onChange({ ...value, number: 5 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <label className="field">
        Feed URL
        <input
          type="url"
          value={(value.link as string) ?? ""}
          onChange={(e) => onChange({ ...value, link: e.target.value })}
          placeholder="https://hnrss.org/frontpage"
        />
      </label>
      <label className="field">
        Number of articles
        <input
          type="number"
          min={1}
          max={50}
          value={(value.number as number) ?? 5}
          onChange={(e) => onChange({ ...value, number: Number(e.target.value) })}
        />
      </label>
    </>
  );
}