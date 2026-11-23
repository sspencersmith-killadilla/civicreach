import { describe, expect, it } from "vitest";
import { citySlug, cityUrl } from "./cities";

describe("city links", () => {
  it("turns a city name into a readable lowercase URL slug", () => {
    expect(citySlug("City of Riverton")).toBe("city-of-riverton");
    expect(citySlug("  St. Louis, MO  ")).toBe("st-louis-mo");
  });

  it("uses the city slug in its resident link", () => {
    expect(cityUrl("riverton")).toBe("/c/riverton");
  });
});
