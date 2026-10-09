import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OAuthCallback } from "../routes/OAuthCallback";
import { useAuth } from "../context/AuthContext";

const navigate = vi.fn();
const login = vi.fn();

vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}));

function renderWithHash(hash: string) {
  window.location.hash = hash;
  return render(
    <MemoryRouter>
      <OAuthCallback />
    </MemoryRouter>
  );
}

describe("OAuthCallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.mocked(useAuth).mockReturnValue({
      user: null, token: null, isAuthenticated: false, isLoading: false, login, logout: vi.fn(),
    });
  });
  afterEach(() => {
    window.location.hash = "";
  });

  it("logs in with the token from the fragment and leaves the page without keeping it in history", () => {
    renderWithHash("#token=jwt&email=a%40b.c");
    expect(login).toHaveBeenCalledWith("jwt", { email: "a@b.c" });
    expect(navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("goes back where the user started connecting an account", () => {
    sessionStorage.setItem("oauth_return_to", "/connections");
    renderWithHash("#linked=github");
    expect(login).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/connections", { replace: true });
  });

  it("never redirects outside the app", () => {
    sessionStorage.setItem("oauth_return_to", "//evil.example");
    renderWithHash("#linked=github");
    expect(navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("sends a failed link to the connections page", () => {
    renderWithHash("#error=already_linked&mode=link");
    expect(navigate).toHaveBeenCalledWith("/connections?error=already_linked", { replace: true });
  });

  it("sends a failed login back to the login page", () => {
    renderWithHash("#error=access_denied&mode=login");
    expect(login).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/login?error=access_denied", { replace: true });
  });
});
