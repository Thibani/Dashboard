import { validateWidgetConfig } from "../validation/widget-config";

describe("validateWidgetConfig", () => {
  it("accepts a config matching the declared params", () => {
    const result = validateWidgetConfig("rss", "article_list", { link: " https://hnrss.org/frontpage ", number: 5 });
    expect(result).toEqual({ ok: true, config: { link: "https://hnrss.org/frontpage", number: 5 } });
  });

  it("rejects an unknown widget", () => {
    expect(validateWidgetConfig("rss", "nope", {}).ok).toBe(false);
  });

  it("rejects a config that is not an object", () => {
    expect(validateWidgetConfig("weather", "city_temperature", "Paris").ok).toBe(false);
    expect(validateWidgetConfig("weather", "city_temperature", ["Paris"]).ok).toBe(false);
    expect(validateWidgetConfig("weather", "city_temperature", null).ok).toBe(false);
  });

  it("rejects unexpected keys", () => {
    const result = validateWidgetConfig("weather", "city_temperature", { city: "Paris", admin: true });
    expect(result).toEqual({ ok: false, error: "Unexpected parameter: admin" });
  });

  it("rejects a missing param", () => {
    expect(validateWidgetConfig("weather", "city_temperature", {}).ok).toBe(false);
  });

  it("rejects wrong types", () => {
    expect(validateWidgetConfig("weather", "city_temperature", { city: 42 }).ok).toBe(false);
    expect(validateWidgetConfig("rss", "article_list", { link: "https://a.com", number: "5" }).ok).toBe(false);
    expect(validateWidgetConfig("rss", "article_list", { link: "https://a.com", number: 2.5 }).ok).toBe(false);
  });

  it("rejects out-of-range integers and empty or oversized strings", () => {
    expect(validateWidgetConfig("rss", "article_list", { link: "https://a.com", number: 0 }).ok).toBe(false);
    expect(validateWidgetConfig("rss", "article_list", { link: "https://a.com", number: 100000 }).ok).toBe(false);
    expect(validateWidgetConfig("weather", "city_temperature", { city: "   " }).ok).toBe(false);
    expect(validateWidgetConfig("weather", "city_temperature", { city: "x".repeat(3000) }).ok).toBe(false);
  });
});