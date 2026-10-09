import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddWidgetDialog } from "../features/widgets/AddWidgetDialog";
import { getConfigForm } from "../features/widgets/registry";
import type { AboutResponse, WidgetInstance } from "../features/widgets/types";
import type { WidgetConfigFormProps } from "../features/widgets/widget-component-types";

vi.mock("../features/widgets/registry", () => ({ getConfigForm: vi.fn() }));
vi.mock("../hooks/useOAuth", () => ({
  useServiceProvider: () => undefined,
  useConnections: () => ({ data: [] }),
}));

const about: AboutResponse = {
  client: { host: "127.0.0.1" },
  server: {
    current_time: 0,
    services: [
      {
        name: "weather",
        widgets: [
          { name: "city_temperature", description: "Temperature for a city", params: [{ name: "city", type: "string" }] },
          { name: "forecast", description: "5-day forecast", params: [{ name: "city", type: "string" }] },
        ],
      },
      {
        name: "rss",
        widgets: [{ name: "article_list", description: "Last articles", params: [{ name: "link", type: "string" }] }],
      },
    ],
  },
};

// Minimal config form: one input that writes {city: <typed text>}.
function FakeConfigForm({ value, onChange }: WidgetConfigFormProps) {
  return (
    <input
      aria-label="city"
      value={(value.city as string) ?? ""}
      onChange={(e) => onChange({ city: e.target.value })}
    />
  );
}

const service = () => screen.getByRole("combobox", { name: /^service/i });
const widget = () => screen.getByRole("combobox", { name: /^widget/i });

describe("AddWidgetDialog", () => {
  const onConfirm = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConfigForm).mockReturnValue(FakeConfigForm);
    vi.stubGlobal("crypto", { randomUUID: () => "generated-id" });
  });
  afterEach(() => vi.unstubAllGlobals());

  const renderNew = () => render(<AddWidgetDialog about={about} onConfirm={onConfirm} onClose={onClose} />);

  it("preselects the first service and widget and shows the description", () => {
    renderNew();
    expect(screen.getByRole("heading", { name: "Add widget" })).toBeInTheDocument();
    expect(service()).toHaveValue("weather");
    expect(widget()).toHaveValue("city_temperature");
    expect(screen.getByText("Temperature for a city")).toBeInTheDocument();
    expect(getConfigForm).toHaveBeenCalledWith("weather", "city_temperature");
  });

  it("confirms a new instance with a generated id, its config and the default 300s refresh", async () => {
    renderNew();
    await userEvent.type(screen.getByLabelText("city"), "Paris");
    await userEvent.click(screen.getByRole("button", { name: "Add to dashboard" }));

    expect(onConfirm).toHaveBeenCalledWith({
      id: "generated-id",
      service: "weather",
      widget: "city_temperature",
      config: { city: "Paris" },
      refreshRateSeconds: 300,
    });
  });

  it("uses the edited refresh rate", async () => {
    renderNew();
    const rate = screen.getByRole("spinbutton");
    expect(rate).toHaveAttribute("min", "10");
    await userEvent.clear(rate);
    await userEvent.type(rate, "60");
    await userEvent.click(screen.getByRole("button", { name: "Add to dashboard" }));

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ refreshRateSeconds: 60 }));
  });

  it("resets the widget and the config when the service changes", async () => {
    renderNew();
    await userEvent.type(screen.getByLabelText("city"), "Paris");
    await userEvent.selectOptions(service(), "rss");

    expect(widget()).toHaveValue("article_list");
    expect(screen.getByLabelText("city")).toHaveValue("");
    expect(screen.getByText("Last articles")).toBeInTheDocument();
  });

  it("resets the config when the widget changes", async () => {
    renderNew();
    await userEvent.type(screen.getByLabelText("city"), "Paris");
    await userEvent.selectOptions(widget(), "forecast");

    expect(screen.getByLabelText("city")).toHaveValue("");
    expect(screen.getByText("5-day forecast")).toBeInTheDocument();
  });

  it("shows an error and disables the confirm button when there is no config form", () => {
    vi.mocked(getConfigForm).mockReturnValue(undefined as never);
    renderNew();
    expect(screen.getByText("No config form for this widget yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to dashboard" })).toBeDisabled();
  });

  describe("edit mode", () => {
    const editing: WidgetInstance = {
      id: "existing-id",
      service: "weather",
      widget: "forecast",
      config: { city: "Lyon" },
      refreshRateSeconds: 120,
    };

    const renderEdit = () =>
      render(<AddWidgetDialog about={about} editingInstance={editing} onConfirm={onConfirm} onClose={onClose} />);

    it("is prefilled and locks the service and widget selectors", () => {
      renderEdit();
      expect(screen.getByRole("heading", { name: "Edit widget" })).toBeInTheDocument();
      expect(service()).toBeDisabled();
      expect(widget()).toBeDisabled();
      expect(widget()).toHaveValue("forecast");
      expect(screen.getByLabelText("city")).toHaveValue("Lyon");
      expect(screen.getByRole("spinbutton")).toHaveValue(120);
    });

    it("keeps the original id when saving", async () => {
      renderEdit();
      await userEvent.type(screen.getByLabelText("city"), "s");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(onConfirm).toHaveBeenCalledWith({ ...editing, config: { city: "Lyons" } });
    });
  });

  describe("closing", () => {
    it("closes with the Cancel button", async () => {
      renderNew();
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes when the backdrop is clicked", async () => {
      const { container } = renderNew();
      await userEvent.click(container.querySelector(".dialog-backdrop")!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("stays open when clicking inside the dialog", async () => {
      renderNew();
      await userEvent.click(screen.getByRole("heading", { name: "Add widget" }));
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
