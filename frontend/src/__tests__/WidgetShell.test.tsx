import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WidgetShell } from "../features/widgets/WidgetShell";
import { useWidgetData } from "../hooks/useWidgetData";
import { getDisplay } from "../features/widgets/registry";
import { ProviderNotConnectedError } from "../lib/api";
import type { WidgetInstance } from "../features/widgets/types";
import type { WidgetDisplayProps } from "../features/widgets/widget-component-types";

vi.mock("../hooks/useWidgetData", () => ({ useWidgetData: vi.fn() }));
vi.mock("../features/widgets/registry", () => ({ getDisplay: vi.fn() }));
vi.mock("../features/oauth/ConnectPrompt", () => ({
  ConnectPrompt: ({ provider, message }: { provider: string; message: string }) => (
    <p>connect:{provider}:{message}</p>
  ),
}));

const instance: WidgetInstance = {
  id: "w1",
  service: "weather",
  widget: "city_temperature",
  config: { city: "Paris" },
  refreshRateSeconds: 45,
};

function FakeDisplay({ data, isLoading, error }: WidgetDisplayProps) {
  return (
    <div>
      <span>loading:{String(isLoading)}</span>
      <span>data:{JSON.stringify(data)}</span>
      <span>error:{error?.message ?? "none"}</span>
    </div>
  );
}

describe("WidgetShell", () => {
  const onRemove = vi.fn();
  const onEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useWidgetData).mockReturnValue({ data: { temp: 18 }, isLoading: false, error: null } as never);
    vi.mocked(getDisplay).mockReturnValue(FakeDisplay);
  });

  it("shows the title and the refresh rate", () => {
    render(<WidgetShell instance={instance} onRemove={onRemove} onEdit={onEdit} />);
    expect(screen.getByText("weather · city_temperature")).toBeInTheDocument();
    expect(screen.getByText("refreshes every 45s")).toBeInTheDocument();
  });

  it("looks up the display by service + widget and feeds it the query state", () => {
    render(<WidgetShell instance={instance} onRemove={onRemove} onEdit={onEdit} />);
    expect(getDisplay).toHaveBeenCalledWith("weather", "city_temperature");
    expect(useWidgetData).toHaveBeenCalledWith(instance);
    expect(screen.getByText('data:{"temp":18}')).toBeInTheDocument();
    expect(screen.getByText("loading:false")).toBeInTheDocument();
  });

  it("passes the query error to the display", () => {
    vi.mocked(useWidgetData).mockReturnValue({ data: undefined, isLoading: false, error: new Error("nope") } as never);
    render(<WidgetShell instance={instance} onRemove={onRemove} onEdit={onEdit} />);
    expect(screen.getByText("error:nope")).toBeInTheDocument();
  });

  it("asks to connect the account instead of showing the display when it is not connected", () => {
    vi.mocked(useWidgetData).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ProviderNotConnectedError("Connect your GitHub account", "github"),
    } as never);
    render(<WidgetShell instance={instance} onRemove={onRemove} onEdit={onEdit} />);
    expect(screen.getByText("connect:github:Connect your GitHub account")).toBeInTheDocument();
    expect(screen.queryByText(/^error:/)).not.toBeInTheDocument();
  });

  it("shows a fallback when no display is registered", () => {
    vi.mocked(getDisplay).mockReturnValue(undefined as never);
    render(<WidgetShell instance={instance} onRemove={onRemove} onEdit={onEdit} />);
    expect(screen.getByText("Unknown widget: weather.city_temperature")).toBeInTheDocument();
  });

  it("calls onEdit with the instance", async () => {
    render(<WidgetShell instance={instance} onRemove={onRemove} onEdit={onEdit} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit widget" }));
    expect(onEdit).toHaveBeenCalledWith(instance);
  });

  it("calls onRemove with the instance id", async () => {
    render(<WidgetShell instance={instance} onRemove={onRemove} onEdit={onEdit} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove widget" }));
    expect(onRemove).toHaveBeenCalledWith("w1");
  });

  it("spreads dragHandleProps on the drag handle", () => {
    render(
      <WidgetShell instance={instance} onRemove={onRemove} onEdit={onEdit} dragHandleProps={{ "data-testid": "handle" }} />
    );
    expect(screen.getByTestId("handle")).toHaveClass("widget-drag-handle");
  });
});
