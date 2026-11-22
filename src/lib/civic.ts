// Shared domain rules and labels for CivicReach.
export type StaffRole = "outreach" | "supervisor";

export const AUTO_APPROVE_LIMIT = 250;
export const MAX_GRANT = 1000;

/** Outreach workers auto-approve up to $250; $251–$1,000 needs a supervisor (supervisors approve directly). */
export function grantRouting(amount: number, role: StaffRole): "approve" | "supervisor_review" | "invalid" {
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_GRANT) return "invalid";
  if (amount <= AUTO_APPROVE_LIMIT || role === "supervisor") return "approve";
  return "supervisor_review";
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function makeTrackingCode(prefix = ""): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return (prefix + body).slice(0, 6).padEnd(6, "X");
}

export const LIVING_SITUATIONS = [
  { id: "in_car", label: "Living in my car" },
  { id: "couch_surfing", label: "Staying with friends / couch-surfing" },
  { id: "sleeping_outside", label: "Sleeping outside" },
  { id: "eviction_7_days", label: "Eviction notice within 7 days" },
] as const;

export const BARRIERS = [
  { id: "car_repair", label: "Car repair" },
  { id: "utility_shutoff", label: "Utility shutoff" },
  { id: "rent_arrears", label: "Rent arrears" },
  { id: "bus_ticket", label: "Bus ticket to family" },
  { id: "lost_id", label: "Lost ID" },
] as const;

export const WELLNESS_NEEDS = [
  { id: "heat_cold", label: "Heat / cold exposure" },
  { id: "medical_mobility", label: "Medical or mobility concern" },
  { id: "basic_supplies", label: "Basic supplies" },
  { id: "welfare_check", label: "Welfare check" },
] as const;

export const SERVICE_CHIPS = [
  "Wellness Check",
  "Water/Hygiene Kit",
  "Meal Voucher",
  "Warm/Cool Gear",
  "ID Recovery",
  "Shelter Intake",
] as const;

export const DOC_TYPES = [
  { id: "id", label: "Driver's License / ID" },
  { id: "birth_certificate", label: "Birth Certificate" },
  { id: "dd214", label: "DD-214" },
  { id: "disability_verification", label: "Disability Verification" },
] as const;

export const SERVICE_HUBS = [
  "Harbor Light Shelter",
  "Eastside Resource Hub",
  "Central Library Navigation Center",
  "Mercy Respite Clinic",
] as const;

export function labelFor(list: readonly { id: string; label: string }[], id: string) {
  return list.find((x) => x.id === id)?.label ?? id;
}

const URGENCY_WEIGHT: Record<string, number> = {
  medical_mobility: 4,
  heat_cold: 3,
  welfare_check: 2,
  basic_supplies: 1,
  eviction_7_days: 4,
  sleeping_outside: 3,
  in_car: 2,
  couch_surfing: 1,
};
export function urgencyScore(tags: string[]): number {
  return tags.reduce((s, t) => s + (URGENCY_WEIGHT[t] ?? 0), 0);
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function timeAgo(iso: string) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
