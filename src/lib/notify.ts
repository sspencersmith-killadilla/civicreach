// Pure helpers for city notifications (shared by server functions and tests).
export type Channel = "email" | "sms";
export const splitList = (s: string) => s.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
export const validEmails = (s: string) => splitList(s).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
export const validPhones = (s: string) => splitList(s).filter((p) => /^\+[1-9]\d{7,14}$/.test(p));

/** Who should be alerted for a new request, given the city's rules. */
export function shouldAlert(kind: "wellness" | "housing", urgentOnly: boolean) {
  return !urgentOnly || kind === "wellness";
}

export function alertText(city: string, kind: "wellness" | "housing", code: string) {
  return kind === "wellness"
    ? `CivicReach ${city}: new wellness check request ${code}. Open the dispatch queue to claim it.`
    : `CivicReach ${city}: new housing help request ${code}. Open the dispatch queue to review it.`;
}
