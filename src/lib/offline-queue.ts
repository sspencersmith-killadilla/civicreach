import { supabase } from "@/integrations/supabase/client";

export type QueuedEncounter = {
  client_ref: string;
  lat: number | null;
  lng: number | null;
  service_chips: string[];
  private_clinical_note: string | null;
  created_at: string;
};

const KEY = "civicreach.encounterQueue.v1";
const listeners = new Set<() => void>();

export function readQueue(): QueuedEncounter[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}
function writeQueue(q: QueuedEncounter[]) {
  localStorage.setItem(KEY, JSON.stringify(q));
  listeners.forEach((l) => l());
}
export function subscribeQueue(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function enqueue(e: QueuedEncounter) {
  writeQueue([...readQueue(), e]);
}

let syncing = false;
/** Pushes queued encounters; client_ref makes retries idempotent. */
export async function syncQueue(): Promise<{ synced: number; remaining: number }> {
  const q = readQueue();
  if (syncing || q.length === 0 || !navigator.onLine) return { synced: 0, remaining: q.length };
  syncing = true;
  try {
    const { error } = await supabase
      .from("field_encounters")
      .upsert(q.map((e) => ({ ...e, synced_from_offline: true })), { onConflict: "client_ref", ignoreDuplicates: true });
    if (error) throw error;
    const sent = new Set(q.map((e) => e.client_ref));
    writeQueue(readQueue().filter((e) => !sent.has(e.client_ref)));
    return { synced: q.length, remaining: readQueue().length };
  } finally {
    syncing = false;
  }
}
