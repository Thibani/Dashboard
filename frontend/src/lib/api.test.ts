import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchAbout,
  fetchDashboard,
  fetchWidgetData,
  loginRequest,
  registerRequest,
  saveDashboard,
  UnauthorizedError,
  verifyRequest,
} from "./api";

const API = "http://localhost:8080";

function mockFetch(body: unknown, init: { ok?: boolean; status?: number; jsonFails?: boolean } = {}) {
  const res = {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: init.jsonFails ? vi.fn().mockRejectedValue(new Error("invalid json")) : vi.fn().mockResolvedValue(body),
  };
  const fn = vi.fn().mockResolvedValue(res);
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchAbout", () => {
  it("returns the parsed about.json", async () => {
    const about = { client: { host: "1.2.3.4" }, server: { current_time: 1, services: [] } };
    const fetchMock = mockFetch(about);
    await expect(fetchAbout()).resolves.toEqual(about);
    expect(fetchMock).toHaveBeenCalledWith(`${API}/about.json`);
  });

  it("throws when the server answers with an error", async () => {
    mockFetch({}, { ok: false, status: 500 });
    await expect(fetchAbout()).rejects.toThrow("Failed to load services");
  });
});

describe("fetchWidgetData", () => {
  it("POSTs service, widget and config, and returns `data`", async () => {
    const fetchMock = mockFetch({ data: { temp: 21 } });
    const result = await fetchWidgetData("weather", "city_temperature", { city: "Paris" });

    expect(result).toEqual({ temp: 21 });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/widgets/preview`);
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(options.body)).toEqual({
      service: "weather",
      widget: "city_temperature",
      config: { city: "Paris" },
    });
  });

  it("uses the server's `error` field when present", async () => {
    mockFetch({ error: "City not found" }, { ok: false, status: 404 });
    await expect(fetchWidgetData("weather", "x", {})).rejects.toThrow("City not found");
  });

  it("falls back to a generic message when the body is not JSON", async () => {
    mockFetch(null, { ok: false, status: 502, jsonFails: true });
    await expect(fetchWidgetData("weather", "x", {})).rejects.toThrow("Widget request failed");
  });
});

describe("loginRequest", () => {
  it("POSTs the credentials and returns token + user", async () => {
    const payload = { token: "jwt", user: { email: "a@b.c" } };
    const fetchMock = mockFetch(payload);
    await expect(loginRequest("a@b.c", "secret123")).resolves.toEqual(payload);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/api/auth/login`);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ email: "a@b.c", password: "secret123" });
  });

  it("prefers `message` over `error`", async () => {
    mockFetch({ message: "Email not verified", error: "other" }, { ok: false, status: 403 });
    await expect(loginRequest("a", "b")).rejects.toThrow("Email not verified");
  });

  it("uses `error` when there is no `message`", async () => {
    mockFetch({ error: "Bad credentials" }, { ok: false, status: 401 });
    await expect(loginRequest("a", "b")).rejects.toThrow("Bad credentials");
  });

  it("falls back to the default message", async () => {
    mockFetch(null, { ok: false, status: 500, jsonFails: true });
    await expect(loginRequest("a", "b")).rejects.toThrow("Invalid email or password");
  });
});

describe("registerRequest", () => {
  it("POSTs the credentials and returns the message", async () => {
    const fetchMock = mockFetch({ message: "ok" });
    await expect(registerRequest("a@b.c", "password1")).resolves.toEqual({ message: "ok" });
    expect(fetchMock.mock.calls[0][0]).toBe(`${API}/api/auth/register`);
  });

  it("surfaces the server message on failure", async () => {
    mockFetch({ message: "Email already used" }, { ok: false, status: 409 });
    await expect(registerRequest("a", "b")).rejects.toThrow("Email already used");
  });

  it("falls back to the default message", async () => {
    mockFetch(null, { ok: false, status: 500, jsonFails: true });
    await expect(registerRequest("a", "b")).rejects.toThrow("Could not create account");
  });
});

describe("verifyRequest", () => {
  it("URL-encodes the token", async () => {
    const fetchMock = mockFetch({ message: "verified" });
    await verifyRequest("a b&c=d");
    expect(fetchMock.mock.calls[0][0]).toBe(`${API}/api/auth/verify?token=a%20b%26c%3Dd`);
  });

  it("returns the body on success", async () => {
    mockFetch({ message: "verified" });
    await expect(verifyRequest("t")).resolves.toEqual({ message: "verified" });
  });

  it("throws the server message when the token is invalid", async () => {
    mockFetch({ message: "Token expired" }, { ok: false, status: 400 });
    await expect(verifyRequest("t")).rejects.toThrow("Token expired");
  });

  it("falls back to the default message", async () => {
    mockFetch(null, { ok: false, status: 500, jsonFails: true });
    await expect(verifyRequest("t")).rejects.toThrow("Could not verify your account");
  });
});

describe("fetchDashboard", () => {
  it("sends the bearer token and returns the instances", async () => {
    const instances = [{ id: "1", service: "weather", widget: "w", config: {}, refreshRateSeconds: 60 }];
    const fetchMock = mockFetch({ instances });
    await expect(fetchDashboard("tok")).resolves.toEqual(instances);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/api/dashboard`);
    expect(options.headers).toEqual({ Authorization: "Bearer tok" });
  });

  it("throws UnauthorizedError on 401", async () => {
    mockFetch({}, { ok: false, status: 401 });
    await expect(fetchDashboard("tok")).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("throws a plain Error on other failures", async () => {
    mockFetch({}, { ok: false, status: 500 });
    const promise = fetchDashboard("tok");
    await expect(promise).rejects.toThrow("Failed to load your dashboard");
    await expect(promise).rejects.not.toBeInstanceOf(UnauthorizedError);
  });
});

describe("saveDashboard", () => {
  const instances = [{ id: "1", service: "rss", widget: "article_list", config: { link: "x" }, refreshRateSeconds: 30 }];

  it("PUTs the instances with the bearer token", async () => {
    const fetchMock = mockFetch({});
    await expect(saveDashboard("tok", instances)).resolves.toBeUndefined();

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/api/dashboard`);
    expect(options.method).toBe("PUT");
    expect(options.headers).toEqual({ "Content-Type": "application/json", Authorization: "Bearer tok" });
    expect(JSON.parse(options.body)).toEqual({ instances });
  });

  it("throws UnauthorizedError on 401", async () => {
    mockFetch({}, { ok: false, status: 401 });
    await expect(saveDashboard("tok", instances)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("throws on other failures", async () => {
    mockFetch({}, { ok: false, status: 500 });
    await expect(saveDashboard("tok", instances)).rejects.toThrow("Failed to save your dashboard");
  });
});
