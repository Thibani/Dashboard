import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWidgetData } from "../hooks/useWidgetData";
import { fetchWidgetData } from "../lib/api";
import type { WidgetInstance } from "../features/widgets/types";

vi.mock("../lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/api")>()),
  fetchWidgetData: vi.fn(),
}));
vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ token: "tok" }) }));

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const base: WidgetInstance = {
  id: "w1",
  service: "weather",
  widget: "city_temperature",
  config: { city: "Paris" },
  refreshRateSeconds: 60,
};

describe("useWidgetData", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches with the session token and the instance's service, widget and config", async () => {
    vi.mocked(fetchWidgetData).mockResolvedValue({ temp: 20 });
    const { result } = renderHook(() => useWidgetData(base), { wrapper: wrapper() });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual({ temp: 20 }));
    expect(fetchWidgetData).toHaveBeenCalledWith("tok", "weather", "city_temperature", { city: "Paris" });
  });

  it("fetches again when the config changes (two configs = two datasets)", async () => {
    vi.mocked(fetchWidgetData).mockImplementation(async (_t, _s, _w, config) => ({ city: config.city }));
    const { result, rerender } = renderHook(({ instance }) => useWidgetData(instance), {
      wrapper: wrapper(),
      initialProps: { instance: base },
    });
    await waitFor(() => expect(result.current.data).toEqual({ city: "Paris" }));

    rerender({ instance: { ...base, config: { city: "Tokyo" } } });
    await waitFor(() => expect(result.current.data).toEqual({ city: "Tokyo" }));
    expect(fetchWidgetData).toHaveBeenCalledTimes(2);
  });

  it("refetches at the instance's refresh rate", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      vi.mocked(fetchWidgetData).mockResolvedValue({});
      renderHook(() => useWidgetData({ ...base, refreshRateSeconds: 10 }), { wrapper: wrapper() });
      await waitFor(() => expect(fetchWidgetData).toHaveBeenCalledTimes(1));

      await vi.advanceTimersByTimeAsync(10_000);
      await waitFor(() => expect(fetchWidgetData).toHaveBeenCalledTimes(2));
    } finally {
      vi.useRealTimers();
    }
  });
});
