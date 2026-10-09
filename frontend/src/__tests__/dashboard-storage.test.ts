import { describe, expect, it } from "vitest";
import { loadInstances, saveInstances } from "../lib/dashboard-storage";

const instance = { id: "1", service: "weather", widget: "w", config: {}, refreshRateSeconds: 60 };

describe("dashboard-storage", () => {
  it("returns an empty list when nothing is stored", () => {
    expect(loadInstances()).toEqual([]);
  });

  it("round-trips instances through localStorage", () => {
    saveInstances([instance]);
    expect(loadInstances()).toEqual([instance]);
  });

  it("returns an empty list when the stored JSON is corrupted", () => {
    localStorage.setItem("dashboard.widget-instances", "{not json");
    expect(loadInstances()).toEqual([]);
  });
});
