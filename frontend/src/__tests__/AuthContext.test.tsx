import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "../context/AuthContext";

const KEY = "dashboard_auth";
const user = { email: "esteban@example.com" };
const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe("AuthProvider", () => {
  it("starts unauthenticated when nothing is stored", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("restores the session from localStorage", () => {
    localStorage.setItem(KEY, JSON.stringify({ token: "tok", user }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe("tok");
    expect(result.current.user).toEqual(user);
  });

  it("ignores corrupted stored data", () => {
    localStorage.setItem(KEY, "{oops");
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("login updates state and persists the session", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login("tok", user));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(user);
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ token: "tok", user });
  });

  it("logout clears state and storage", () => {
    localStorage.setItem(KEY, JSON.stringify({ token: "tok", user }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.logout());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});

describe("useAuth", () => {
  it("throws when used outside an AuthProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used inside an AuthProvider");
  });
});
