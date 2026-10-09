import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireAuth } from "../components/layout/RequireAuth";
import { useAuth } from "../context/AuthContext";

vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

function setAuth(state: { isAuthenticated: boolean; isLoading: boolean }) {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    token: null,
    login: vi.fn(),
    logout: vi.fn(),
    ...state,
  });
}

function LoginProbe() {
  const location = useLocation();
  return <div>login page (from: {(location.state as { from?: string } | null)?.from})</div>;
}

function renderAt(path = "/private") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/private" element={<RequireAuth><p>secret content</p></RequireAuth>} />
        <Route path="/login" element={<LoginProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("RequireAuth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders nothing while the session is loading", () => {
    setAuth({ isAuthenticated: false, isLoading: true });
    const { container } = renderAt();
    expect(container).toBeEmptyDOMElement();
  });

  it("redirects to /login and remembers the origin when unauthenticated", () => {
    setAuth({ isAuthenticated: false, isLoading: false });
    renderAt();
    expect(screen.getByText("login page (from: /private)")).toBeInTheDocument();
    expect(screen.queryByText("secret content")).not.toBeInTheDocument();
  });

  it("renders the children when authenticated", () => {
    setAuth({ isAuthenticated: true, isLoading: false });
    renderAt();
    expect(screen.getByText("secret content")).toBeInTheDocument();
  });
});
