import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Login } from "../routes/Login";
import { loginRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const navigate = vi.fn();
const login = vi.fn();

vi.mock("../lib/api", () => ({ loginRequest: vi.fn() }));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../features/oauth/OAuthButtons", () => ({ OAuthButtons: () => <div>oauth-buttons</div> }));
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}));

function renderLogin(state?: { from: string }, search = "") {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/login", search, state }]}>
      <Login />
    </MemoryRouter>
  );
}

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText(/email/i), "a@b.c");
  await userEvent.type(screen.getByLabelText(/password/i), "secret123");
  await userEvent.click(screen.getByRole("button", { name: "Log in" }));
}

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: null, token: null, isAuthenticated: false, isLoading: false, login, logout: vi.fn(),
    });
  });

  it("renders the form and a link to registration", () => {
    renderLogin();
    expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(/password/i)).toHaveAttribute("type", "password");
    expect(screen.getByRole("link", { name: "Create one" })).toHaveAttribute("href", "/register");
  });

  it("shows the GitHub/Google sign-in buttons", () => {
    renderLogin();
    expect(screen.getByText("oauth-buttons")).toBeInTheDocument();
  });

  it("explains a failed GitHub/Google sign-in passed as ?error=", () => {
    renderLogin(undefined, "?error=access_denied");
    expect(screen.getByText("You cancelled the authorization.")).toBeInTheDocument();
  });

  it("logs in and navigates to / by default", async () => {
    vi.mocked(loginRequest).mockResolvedValue({ token: "tok", user: { email: "a@b.c" } });
    renderLogin();
    await fillAndSubmit();

    await waitFor(() => expect(login).toHaveBeenCalledWith("tok", { email: "a@b.c" }));
    expect(loginRequest).toHaveBeenCalledWith("a@b.c", "secret123");
    expect(navigate).toHaveBeenCalledWith("/");
  });

  it("navigates back to the page the user came from", async () => {
    vi.mocked(loginRequest).mockResolvedValue({ token: "tok", user: { email: "a@b.c" } });
    renderLogin({ from: "/somewhere" });
    await fillAndSubmit();

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/somewhere"));
  });

  it("shows the error message and does not log in on failure", async () => {
    vi.mocked(loginRequest).mockRejectedValue(new Error("Invalid email or password"));
    renderLogin();
    await fillAndSubmit();

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("uses a generic message when a non-Error is thrown", async () => {
    vi.mocked(loginRequest).mockRejectedValue("boom");
    renderLogin();
    await fillAndSubmit();
    expect(await screen.findByText("Could not log in")).toBeInTheDocument();
  });

  it("disables the button while submitting, then re-enables it", async () => {
    let resolve!: (v: { token: string; user: { email: string } }) => void;
    vi.mocked(loginRequest).mockReturnValue(new Promise((r) => (resolve = r)));
    renderLogin();
    await fillAndSubmit();

    expect(screen.getByRole("button", { name: "Logging in…" })).toBeDisabled();
    resolve({ token: "t", user: { email: "a@b.c" } });
    await waitFor(() => expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled());
  });
});
