import { describe, expect, it } from "vitest";
import { grantRouting, makeTrackingCode } from "./civic";

describe("micro-grant routing", () => {
  it("auto-approves $250 for an outreach worker", () => {
    expect(grantRouting(250, "outreach")).toBe("approve");
  });
  it("routes $251 from an outreach worker to supervisor review", () => {
    expect(grantRouting(251, "outreach")).toBe("supervisor_review");
  });
  it("lets a supervisor approve $1,000 directly", () => {
    expect(grantRouting(1000, "supervisor")).toBe("approve");
  });
  it("rejects grants above $1,000", () => {
    expect(grantRouting(1001, "supervisor")).toBe("invalid");
  });
});

describe("tracking codes", () => {
  it("are 6 characters", () => {
    expect(makeTrackingCode("DV")).toHaveLength(6);
  });
});
