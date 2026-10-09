import { registerSchema, loginSchema, dashboardSchema, widgetPreviewSchema } from "../validation/schemas";

describe("registerSchema", () => {
  it("normalizes the email (trim + lowercase)", () => {
    const result = registerSchema.parse({ email: "  Zoe@Example.COM ", password: "password123" });
    expect(result.email).toBe("zoe@example.com");
  });

  it("rejects an invalid email", () => {
    expect(registerSchema.safeParse({ email: "not-an-email", password: "password123" }).success).toBe(false);
  });

  it("rejects a short or oversized password", () => {
    expect(registerSchema.safeParse({ email: "a@a.com", password: "short" }).success).toBe(false);
    expect(registerSchema.safeParse({ email: "a@a.com", password: "x".repeat(73) }).success).toBe(false);
  });

  it("rejects non-string values (e.g. a NoSQL-style object)", () => {
    expect(registerSchema.safeParse({ email: { $ne: "" }, password: "password123" }).success).toBe(false);
    expect(registerSchema.safeParse({ email: "a@a.com", password: ["password123"] }).success).toBe(false);
  });

  it("rejects a missing body", () => {
    expect(registerSchema.safeParse(undefined).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid credentials and normalizes the email", () => {
    expect(loginSchema.parse({ email: "A@A.com", password: "pw" }).email).toBe("a@a.com");
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@a.com", password: "" }).success).toBe(false);
  });
});

describe("dashboardSchema", () => {
  const valid = {
    id: "abc",
    service: "weather",
    widget: "city_temperature",
    config: { city: "Paris" },
    refreshRateSeconds: 300,
  };

  it("accepts valid instances, including an empty list", () => {
    expect(dashboardSchema.safeParse({ instances: [valid] }).success).toBe(true);
    expect(dashboardSchema.safeParse({ instances: [] }).success).toBe(true);
  });

  it("rejects an instance whose config does not match its widget", () => {
    const bad = { ...valid, config: { city: "Paris", extra: 1 } };
    expect(dashboardSchema.safeParse({ instances: [bad] }).success).toBe(false);
  });

  it("rejects an unknown widget", () => {
    expect(dashboardSchema.safeParse({ instances: [{ ...valid, widget: "nope" }] }).success).toBe(false);
  });

  it("keeps the widget size (it used to be stripped, so widgets came back 1x1)", () => {
    const result = dashboardSchema.safeParse({ instances: [{ ...valid, width: 2, height: 3 }] });
    expect(result.success).toBe(true);
    expect(result.data?.instances[0]).toMatchObject({ width: 2, height: 3 });
  });

  it("rejects a widget size outside the grid", () => {
    for (const size of [{ width: 0 }, { width: 6 }, { height: 0 }, { height: 9 }, { width: 1.5 }]) {
      expect(dashboardSchema.safeParse({ instances: [{ ...valid, ...size }] }).success).toBe(false);
    }
  });

  it("rejects a refresh rate below 10 seconds", () => {
    expect(dashboardSchema.safeParse({ instances: [{ ...valid, refreshRateSeconds: 1 }] }).success).toBe(false);
  });

  it("rejects too many widgets", () => {
    const many = Array.from({ length: 51 }, (_, i) => ({ ...valid, id: String(i) }));
    expect(dashboardSchema.safeParse({ instances: many }).success).toBe(false);
  });
});

describe("widgetPreviewSchema", () => {
  it("accepts a valid preview request", () => {
    const body = { service: "rss", widget: "article_list", config: { link: "https://a.com/rss", number: 5 } };
    expect(widgetPreviewSchema.safeParse(body).success).toBe(true);
  });

  it("rejects a config with the wrong types", () => {
    const body = { service: "rss", widget: "article_list", config: { link: "https://a.com/rss", number: "5" } };
    expect(widgetPreviewSchema.safeParse(body).success).toBe(false);
  });
});