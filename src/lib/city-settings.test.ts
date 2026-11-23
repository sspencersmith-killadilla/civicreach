import { describe, expect, it } from "vitest";
import { defaultSettings, isOpenNow, mergeSettings, readiness } from "./city-settings";
import { grantRouting } from "./civic";

describe("city settings", () => {
  it("defaults keep the $250 worker limit and $1,000 max", () => {
    const g = defaultSettings().grants;
    expect(g.workerLimit).toBe(250);
    expect(g.max).toBe(1000);
  });
  it("fills missing fields from defaults", () => {
    const s = mergeSettings({ emergency: { crisisLine: "211" } });
    expect(s.emergency.crisisLine).toBe("211");
    expect(s.emergency.emergencyNumber).toBe("911");
  });
  it("a new city is not launch-ready", () => {
    expect(readiness(defaultSettings()).every((r) => r.done)).toBe(false);
  });
  it("closed outside configured hours", () => {
    const s = defaultSettings(); s.profile.timeZone = "UTC";
    expect(isOpenNow(s, new Date("2026-11-23T03:00:00Z"))).toBe(false);
    expect(isOpenNow(s, new Date("2026-11-23T12:00:00Z"))).toBe(true);
  });
});

describe("city grant limits", () => {
  const limits = { min: 50, max: 2000, workerLimit: 500 };
  it("uses the city's worker limit", () => {
    expect(grantRouting(500, "outreach", limits)).toBe("approve");
    expect(grantRouting(501, "outreach", limits)).toBe("supervisor_review");
  });
  it("rejects below the city's minimum and above its maximum", () => {
    expect(grantRouting(49, "supervisor", limits)).toBe("invalid");
    expect(grantRouting(2001, "supervisor", limits)).toBe("invalid");
  });
});
