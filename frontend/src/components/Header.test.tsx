import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "./Header";
import { useAuth } from "../context/AuthContext";

vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

const logout = vi.fn();

function setAuth(email: string | null) {
  vi.mocked(useAuth).mockReturnValue({
    user: email ? { email } : null,
    token: email ? "tok" : null,
    isAuthenticated: !!email,
    isLoading: false,
    login: vi.fn(),
    logout,
  });
}

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );

describe("Header", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows login and register links for anonymous visitors", () => {
    setAuth(null);
    renderHeader();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/register");
    expect(screen.queryByRole("button", { name: "Account menu" })).not.toBeInTheDocument();
  });

  it("links the brand to the dashboard", () => {
    setAuth(null);
    renderHeader();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/");
  });

  it("shows the uppercase initials of the email when authenticated", () => {
    setAuth("esteban@example.com");
    renderHeader();
    expect(screen.getByRole("button", { name: "Account menu" })).toHaveTextContent("ES");
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
  });

  it("toggles the account menu", async () => {
    setAuth("esteban@example.com");
    renderHeader();
    const avatar = screen.getByRole("button", { name: "Account menu" });

    expect(avatar).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(avatar);
    expect(avatar).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("esteban@example.com")).toBeInTheDocument();

    await userEvent.click(avatar);
    expect(screen.queryByText("esteban@example.com")).not.toBeInTheDocument();
  });

  it("calls logout from the menu", async () => {
    setAuth("esteban@example.com");
    renderHeader();
    await userEvent.click(screen.getByRole("button", { name: "Account menu" }));
    await userEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("closes the menu when clicking outside", async () => {
    setAuth("esteban@example.com");
    renderHeader();
    await userEvent.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.getByText("esteban@example.com")).toBeInTheDocument();

    await userEvent.click(document.body);
    expect(screen.queryByText("esteban@example.com")).not.toBeInTheDocument();
  });
});
