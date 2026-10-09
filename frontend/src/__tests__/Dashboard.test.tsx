import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Dashboard } from "../routes/Dashboard";
import { fetchAbout, fetchDashboard, saveDashboard, UnauthorizedError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { AboutResponse, WidgetInstance } from "../features/widgets/types";

vi.mock("../lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/api")>()),
  fetchAbout: vi.fn(),
  fetchDashboard: vi.fn(),
  saveDashboard: vi.fn(),
}));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

// Lightweight stand-ins: the real ones are covered by their own tests.
vi.mock("../features/widgets/WidgetShell", () => ({
  WidgetShell: ({ instance, onRemove, onEdit }: {
    instance: WidgetInstance; onRemove: (id: string) => void; onEdit: (i: WidgetInstance) => void;
  }) => (
    <div data-testid="widget">
      <span>{instance.id}</span>
      <button onClick={() => onRemove(instance.id)}>remove {instance.id}</button>
      <button onClick={() => onEdit(instance)}>edit {instance.id}</button>
    </div>
  ),
}));
vi.mock("../features/widgets/AddWidgetDialog", () => ({
  AddWidgetDialog: ({ editingInstance, onConfirm, onClose }: {
    editingInstance?: WidgetInstance; onConfirm: (i: WidgetInstance) => void; onClose: () => void;
  }) => (
    <div role="dialog">
      <span>{editingInstance ? `editing ${editingInstance.id}` : "adding"}</span>
      <button
        onClick={() =>
          onConfirm(
            editingInstance
              ? { ...editingInstance, refreshRateSeconds: 99 }
              : { id: "new", service: "rss", widget: "article_list", config: {}, refreshRateSeconds: 300 }
          )
        }
      >
        confirm
      </button>
      <button onClick={onClose}>close</button>
    </div>
  ),
}));

const about: AboutResponse = { client: { host: "h" }, server: { current_time: 0, services: [] } };
const w1: WidgetInstance = { id: "w1", service: "weather", widget: "city_temperature", config: {}, refreshRateSeconds: 60 };
const w2: WidgetInstance = { id: "w2", service: "rss", widget: "article_list", config: {}, refreshRateSeconds: 60 };

const logout = vi.fn();

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Dashboard />
    </QueryClientProvider>
  );
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { email: "a@b.c" }, token: "tok", isAuthenticated: true, isLoading: false, login: vi.fn(), logout,
    });
    vi.mocked(fetchAbout).mockResolvedValue(about);
    vi.mocked(fetchDashboard).mockResolvedValue([w1, w2]);
    vi.mocked(saveDashboard).mockResolvedValue(undefined);
  });

  describe("loading states", () => {
    it("shows a loading message first", () => {
      vi.mocked(fetchAbout).mockReturnValue(new Promise(() => {}));
      renderDashboard();
      expect(screen.getByText("Loading…")).toBeInTheDocument();
    });

    it("reports an unreachable server", async () => {
      vi.mocked(fetchAbout).mockRejectedValue(new Error("down"));
      renderDashboard();
      expect(await screen.findByText("Could not reach the server.")).toBeInTheDocument();
    });

    it("reports a dashboard that could not be loaded", async () => {
      vi.mocked(fetchDashboard).mockRejectedValue(new Error("500"));
      renderDashboard();
      expect(await screen.findByText("Could not load your dashboard.")).toBeInTheDocument();
      expect(logout).not.toHaveBeenCalled();
    });

    it("logs out when the token is rejected", async () => {
      vi.mocked(fetchDashboard).mockRejectedValue(new UnauthorizedError("Session expired"));
      renderDashboard();
      await waitFor(() => expect(logout).toHaveBeenCalled());
    });

    it("loads the dashboard with the user's token", async () => {
      renderDashboard();
      await screen.findAllByTestId("widget");
      expect(fetchDashboard).toHaveBeenCalledWith("tok");
    });
  });

  describe("content", () => {
    it("renders one card per saved instance", async () => {
      renderDashboard();
      expect(await screen.findAllByTestId("widget")).toHaveLength(2);
      expect(screen.queryByText(/No widgets yet/)).not.toBeInTheDocument();
    });

    it("shows the empty state when there are no widgets", async () => {
      vi.mocked(fetchDashboard).mockResolvedValue([]);
      renderDashboard();
      expect(await screen.findByText(/No widgets yet/)).toBeInTheDocument();
    });

    it("does not save right after loading", async () => {
      renderDashboard();
      await screen.findAllByTestId("widget");
      expect(saveDashboard).not.toHaveBeenCalled();
    });
  });

  describe("editing the dashboard", () => {
    it("removes a widget and saves the remaining ones", async () => {
      renderDashboard();
      await userEvent.click(await screen.findByRole("button", { name: "remove w1" }));

      expect(screen.getAllByTestId("widget")).toHaveLength(1);
      await waitFor(() => expect(saveDashboard).toHaveBeenCalledWith("tok", [w2]));
    });

    it("adds a widget through the dialog and saves it", async () => {
      renderDashboard();
      await userEvent.click(await screen.findByRole("button", { name: "+ Add widget" }));
      expect(screen.getByText("adding")).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "confirm" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getAllByTestId("widget")).toHaveLength(3);
      await waitFor(() =>
        expect(saveDashboard).toHaveBeenCalledWith("tok", [w1, w2, expect.objectContaining({ id: "new" })])
      );
    });

    it("edits an existing widget in place", async () => {
      renderDashboard();
      await userEvent.click(await screen.findByRole("button", { name: "edit w2" }));
      expect(screen.getByText("editing w2")).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "confirm" }));

      expect(screen.getAllByTestId("widget")).toHaveLength(2);
      await waitFor(() =>
        expect(saveDashboard).toHaveBeenCalledWith("tok", [w1, { ...w2, refreshRateSeconds: 99 }])
      );
    });

    it("closes the dialog without saving", async () => {
      renderDashboard();
      await userEvent.click(await screen.findByRole("button", { name: "+ Add widget" }));
      await userEvent.click(screen.getByRole("button", { name: "close" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(saveDashboard).not.toHaveBeenCalled();
    });
  });

  describe("save errors", () => {
    it("shows a warning when saving fails, and clears it after a successful save", async () => {
      vi.mocked(saveDashboard).mockRejectedValueOnce(new Error("offline"));
      renderDashboard();
      await userEvent.click(await screen.findByRole("button", { name: "remove w1" }));
      expect(await screen.findByText("Could not save your changes. Check your connection.")).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "remove w2" }));
      await waitFor(() =>
        expect(screen.queryByText("Could not save your changes. Check your connection.")).not.toBeInTheDocument()
      );
    });

    it("logs out when the token expires during a save", async () => {
      vi.mocked(saveDashboard).mockRejectedValue(new UnauthorizedError("Session expired"));
      renderDashboard();
      await userEvent.click(await screen.findByRole("button", { name: "remove w1" }));

      await waitFor(() => expect(logout).toHaveBeenCalled());
      expect(screen.queryByText(/Could not save/)).not.toBeInTheDocument();
    });
  });
});
