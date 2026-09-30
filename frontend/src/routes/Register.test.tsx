import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Register } from "./Register";
import { registerRequest } from "../lib/api";

vi.mock("../lib/api", () => ({ registerRequest: vi.fn() }));

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText(/email/i), "new@user.io");
  await userEvent.type(screen.getByLabelText(/password/i), "longenough1");
  await userEvent.click(screen.getByRole("button", { name: "Create account" }));
}

describe("Register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the form with a minimum password length of 8", () => {
    renderRegister();
    expect(screen.getByRole("heading", { name: "Create account" })).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toHaveAttribute("minlength", "8");
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });

  it("shows the confirmation screen with the email after success", async () => {
    vi.mocked(registerRequest).mockResolvedValue({ message: "ok" });
    renderRegister();
    await fillAndSubmit();

    expect(registerRequest).toHaveBeenCalledWith("new@user.io", "longenough1");
    expect(await screen.findByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    expect(screen.getByText("new@user.io")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to log in" })).toHaveAttribute("href", "/login");
  });

  it("shows the server error and stays on the form", async () => {
    vi.mocked(registerRequest).mockRejectedValue(new Error("Email already used"));
    renderRegister();
    await fillAndSubmit();

    expect(await screen.findByText("Email already used")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Create account" })).toBeInTheDocument();
  });

  it("uses a generic message when a non-Error is thrown", async () => {
    vi.mocked(registerRequest).mockRejectedValue("boom");
    renderRegister();
    await fillAndSubmit();
    expect(await screen.findByText("Could not create account")).toBeInTheDocument();
  });

  it("disables the button while the request is pending", async () => {
    vi.mocked(registerRequest).mockReturnValue(new Promise(() => {}));
    renderRegister();
    await fillAndSubmit();
    expect(screen.getByRole("button", { name: "Creating account…" })).toBeDisabled();
  });
});
