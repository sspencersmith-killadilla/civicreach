// City-configurable operating rules. Defaults match the original CivicReach rules.
import { BARRIERS, LIVING_SITUATIONS, SERVICE_CHIPS, SERVICE_HUBS, WELLNESS_NEEDS, DOC_TYPES } from "./civic";

export type Option = { id: string; label: string; enabled: boolean };
export type Hub = { name: string; address: string; hours: string };
export type DayHours = { day: string; open: string; close: string; closed: boolean };

export type CitySettings = {
  profile: { displayName: string; contactPhone: string; contactEmail: string; website: string; timeZone: string };
  hours: { alwaysOpen: boolean; week: DayHours[]; afterHoursMessage: string };
  emergency: { emergencyNumber: string; crisisLine: string; escalationRules: string; disclaimer: string };
  targets: { urgentMinutes: number; standardMinutes: number; housingFollowUp: string };
  intake: { livingSituations: Option[]; barriers: Option[]; wellnessNeeds: Option[]; serviceChips: Option[]; docTypes: Option[] };
  grants: { min: number; max: number; workerLimit: number; paymentMethods: Option[] };
  hubs: Hub[];
  zones: string[];
  notifications: { alertEmails: string; urgentOnly: boolean };
  privacy: { consent: string; retentionDays: number; recordsContact: string };
  languages: { spanish: boolean };
  integrations: {
    sms: { provider: string; fromNumber: string; residentUpdates: boolean };
    rides: { provider: string; bookingUrl: string; phone: string };
    payments: { provider: string; instructions: string };
  };
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const opt = (id: string, label: string): Option => ({ id, label, enabled: true });
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export function defaultSettings(): CitySettings {
  return {
    profile: { displayName: "", contactPhone: "", contactEmail: "", website: "", timeZone: "America/Chicago" },
    hours: { alwaysOpen: false, week: DAYS.map((day, i) => ({ day, open: "08:00", close: "18:00", closed: i > 4 })), afterHoursMessage: "Outreach teams are offline right now. Your request is saved and will be reviewed when the team is back." },
    emergency: { emergencyNumber: "911", crisisLine: "988", escalationRules: "", disclaimer: "Response times are targets, not guarantees. For immediate danger, call emergency services." },
    targets: { urgentMinutes: 45, standardMinutes: 120, housingFollowUp: "within one business day" },
    intake: {
      livingSituations: LIVING_SITUATIONS.map((o) => opt(o.id, o.label)),
      barriers: BARRIERS.map((o) => opt(o.id, o.label)),
      wellnessNeeds: WELLNESS_NEEDS.map((o) => opt(o.id, o.label)),
      serviceChips: SERVICE_CHIPS.map((c) => opt(slug(c), c)),
      docTypes: DOC_TYPES.map((o) => opt(o.id, o.label)),
    },
    grants: { min: 50, max: 1000, workerLimit: 250, paymentMethods: [opt("vendor_check", "Vendor check"), opt("ach_landlord", "ACH to landlord"), opt("utility_direct", "Utility direct pay"), opt("prepaid_card", "Prepaid card"), opt("transit_voucher", "Transit voucher")] },
    hubs: SERVICE_HUBS.map((name) => ({ name, address: "", hours: "" })),
    zones: ["Central"],
    notifications: { alertEmails: "", urgentOnly: true },
    privacy: { consent: "I agree that city outreach staff may store this information to help me.", retentionDays: 1095, recordsContact: "" },
    languages: { spanish: true },
    integrations: {
      sms: { provider: "none", fromNumber: "", residentUpdates: false },
      rides: { provider: "none", bookingUrl: "", phone: "" },
      payments: { provider: "manual", instructions: "" },
    },
  };
}

function isObj(v: unknown): v is Record<string, unknown> { return !!v && typeof v === "object" && !Array.isArray(v); }

/** Deep-merges stored settings over defaults so new fields always have values. */
export function mergeSettings(stored: unknown): CitySettings {
  const merge = (base: unknown, over: unknown): unknown => {
    if (over === undefined || over === null) return base;
    if (isObj(base) && isObj(over)) {
      const out: Record<string, unknown> = { ...base };
      for (const k of Object.keys(over)) out[k] = merge(base[k], over[k]);
      return out;
    }
    if (Array.isArray(base)) return Array.isArray(over) ? over : base;
    return typeof over === typeof base ? over : base;
  };
  return merge(defaultSettings(), stored) as CitySettings;
}

export const enabled = (list: Option[]) => list.filter((o) => o.enabled);
export const newOption = (label: string): Option => ({ id: slug(label) || `opt_${Date.now()}`, label: label.trim(), enabled: true });

export type ReadinessItem = { id: string; label: string; done: boolean };
export function readiness(s: CitySettings): ReadinessItem[] {
  return [
    { id: "profile", label: "Public contact details", done: !!(s.profile.contactPhone || s.profile.contactEmail) },
    { id: "hours", label: "Outreach hours", done: s.hours.alwaysOpen || s.hours.week.some((d) => !d.closed) },
    { id: "emergency", label: "Emergency & escalation rules", done: !!s.emergency.emergencyNumber && s.emergency.escalationRules.trim().length > 10 },
    { id: "intake", label: "Intake options", done: enabled(s.intake.barriers).length > 0 && enabled(s.intake.wellnessNeeds).length > 0 && enabled(s.intake.livingSituations).length > 0 },
    { id: "grants", label: "Grant limits", done: validGrantLimits(s.grants) },
    { id: "hubs", label: "Local service hubs", done: s.hubs.some((h) => h.name && h.address) },
    { id: "notifications", label: "Alert contacts", done: s.notifications.alertEmails.includes("@") },
    { id: "privacy", label: "Privacy & retention", done: s.privacy.consent.length > 10 && s.privacy.retentionDays > 0 && !!s.privacy.recordsContact },
  ];
}

export function validGrantLimits(g: { min: number; max: number; workerLimit: number }) {
  return g.min > 0 && g.max >= g.min && g.workerLimit >= 0 && g.workerLimit <= g.max;
}

/** Is outreach staffed at this moment in the city's time zone? */
export function isOpenNow(s: CitySettings, now = new Date()): boolean {
  if (s.hours.alwaysOpen) return true;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: s.profile.timeZone || "UTC", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = s.hours.week.find((d) => d.day === get("weekday"));
  if (!day || day.closed) return false;
  const hm = `${get("hour").replace("24", "00")}:${get("minute")}`;
  return hm >= day.open && hm < day.close;
}
