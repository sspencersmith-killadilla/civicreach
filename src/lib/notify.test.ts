import { describe, expect, it } from "vitest";
import { shouldAlert, validEmails, validPhones } from "./notify";
describe("city notifications", () => {
  it("urgent-only alerts skip housing requests", () => { expect(shouldAlert("housing", true)).toBe(false); expect(shouldAlert("wellness", true)).toBe(true); });
  it("all-requests mode alerts on housing", () => expect(shouldAlert("housing", false)).toBe(true));
  it("keeps only valid emails and E.164 phones", () => {
    expect(validEmails("a@city.gov, bad, b@x.org")).toEqual(["a@city.gov", "b@x.org"]);
    expect(validPhones("+15551234567, 555-1234")).toEqual(["+15551234567"]);
  });
});
