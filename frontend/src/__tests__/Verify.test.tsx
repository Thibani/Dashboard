import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Verify } from "../routes/Verify";
import { verifyRequest } from "../lib/api";

vi.mock("../lib/api", () => ({ verifyRequest: vi.fn() }));

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Verify />
    </MemoryRouter>
  );

describe("Verify", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows an error without calling the API when the token is missing", () => {
    renderAt("/verify");
    expect(screen.getByRole("heading", { name: "Verification failed" })).toBeInTheDocument();
    expect(screen.getByText("This confirmation link is missing its token.")).toBeInTheDocument();
    expect(verifyRequest).not.toHaveBeenCalled();
  });

  it("shows a loading state while verifying", () => {
    vi.mocked(verifyRequest).mockReturnValue(new Promise(() => {}));
    renderAt("/verify?token=abc");
    expect(screen.getByRole("heading", { name: "Verifying your account…" })).toBeInTheDocument();
  });

  it("shows success and a login link once verified", async () => {
    vi.mocked(verifyRequest).mockResolvedValue({ message: "Your account is active" });
    renderAt("/verify?token=abc");

    expect(await screen.findByRole("heading", { name: "Account confirmed" })).toBeInTheDocument();
    expect(screen.getByText("Your account is active")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(verifyRequest).toHaveBeenCalledWith("abc");
  });

  it("shows the server error and a link to register again", async () => {
    vi.mocked(verifyRequest).mockRejectedValue(new Error("Token expired"));
    renderAt("/verify?token=abc");

    expect(await screen.findByRole("heading", { name: "Verification failed" })).toBeInTheDocument();
    expect(screen.getByText("Token expired")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create a new account" })).toHaveAttribute("href", "/register");
  });

  it("uses a generic message when a non-Error is thrown", async () => {
    vi.mocked(verifyRequest).mockRejectedValue("boom");
    renderAt("/verify?token=abc");
    expect(await screen.findByText("Could not verify your account")).toBeInTheDocument();
  });

  it("consumes the single-use token only once", async () => {
    vi.mocked(verifyRequest).mockResolvedValue({ message: "ok" });
    const { rerender } = renderAt("/verify?token=abc");
    await screen.findByRole("heading", { name: "Account confirmed" });

    rerender(
      <MemoryRouter initialEntries={["/verify?token=abc"]}>
        <Verify />
      </MemoryRouter>
    );
    expect(verifyRequest).toHaveBeenCalledTimes(1);
  });
});
