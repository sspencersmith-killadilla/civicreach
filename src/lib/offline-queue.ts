import { supabase } from "@/integrations/supabase/client";
import { DEMO_CITY } from "./cities";

export type QueuedEncounter = {
  client_ref: string;
  city_id: string;
  lat: number | null;
  lng: number | null;
  service_chips: string[];
  private_clinical_note: string | null;
  created_at: string;
};

const KEY = "civicreach.encounterQueue.v1";
const listeners = new Set<() => void>();

export function readQueue(cityId?: string): QueuedEncounter[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? "[]") as Array<Omit<QueuedEncounter, "city_id"> & { city_id?: string }>;
    const entries = stored.map((entry) => ({ ...entry, city_id: entry.city_id ?? DEMO_CITY.id }));
    return cityId ? entries.filter((entry) => entry.city_id === cityId) : entries;
  } catch { return []; }
}
function writeQueue(queue: QueuedEncounter[]) { localStorage.setItem(KEY, JSON.stringify(queue)); listeners.forEach((listener) => listener()); }
export function subscribeQueue(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); }
export function enqueue(entry: QueuedEncounter) { writeQueue([...readQueue(), entry]); }

let syncing = false;
/** Pushes only the active city's entries; client_ref makes retries idempotent. */
export async function syncQueue(cityId: string): Promise<{ synced: number; remaining: number }> {
  const queue = readQueue(cityId);
  if (syncing || queue.length === 0 || !navigator.onLine) return { synced: 0, remaining: queue.length };
  syncing = true;
  try {
    const { error } = await supabase.from("field_encounters").upsert(queue.map((entry) => ({ ...entry, city_id: cityId, synced_from_offline: true })), { onConflict: "client_ref", ignoreDuplicates: true });
    if (error) throw error;
    const sent = new Set(queue.map((entry) => entry.client_ref));
    writeQueue(readQueue().filter((entry) => !sent.has(entry.client_ref)));
    return { synced: queue.length, remaining: readQueue(cityId).length };
  } finally { syncing = false; }
}
