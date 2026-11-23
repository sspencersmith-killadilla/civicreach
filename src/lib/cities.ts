export type CitySummary = {
  id: string;
  name: string;
  slug: string;
  region: string;
};

export const DEMO_CITY: CitySummary = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Demo City",
  slug: "demo",
  region: "Sample workspace",
};

/** Converts a city name into the readable, URL-safe base used by provisioning. */
export function citySlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

export function cityUrl(slug: string): string {
  return `/c/${encodeURIComponent(slug)}`;
}
