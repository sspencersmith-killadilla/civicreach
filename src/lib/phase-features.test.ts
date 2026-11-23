import { describe, expect, it } from "vitest";
import { looksAutomated, MIN_FILL_MS } from "./bot-guard";
import { translate } from "./i18n";
import { mergeSettings } from "./city-settings";

describe("bot guard", () => {
  it("flags a filled honeypot", () => expect(looksAutomated("http://spam", 0, 60_000)).toBe(true));
  it("flags forms submitted faster than the minimum fill time", () => expect(looksAutomated("", 1000, 1000 + MIN_FILL_MS - 1)).toBe(true));
  it("allows a normal human submission", () => expect(looksAutomated("", 0, 10_000)).toBe(false));
});

describe("translations", () => {
  it("returns Spanish for known resident text", () => expect(translate("es", "Check status")).toBe("Consultar"));
  it("falls back to English for unknown text", () => expect(translate("es", "Unknown phrase")).toBe("Unknown phrase"));
  it("maps statuses to plain language", () => expect(translate("en", "en_route")).toBe("A team is on the way"));
});

describe("integration defaults", () => {
  it("older stored settings gain integration defaults", () => {
    const s = mergeSettings({ profile: { contactPhone: "555" } });
    expect(s.integrations.payments.provider).toBe("manual");
    expect(s.languages.spanish).toBe(true);
  });
});

import { toCsv } from "./csv";
describe("csv export", () => {
  it("quotes commas and quotes", () => expect(toCsv([{ a: 'x,"y"', b: 2 }])).toBe('a,b\n"x,""y""",2'));
});
