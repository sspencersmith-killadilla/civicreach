import { useEffect, useState, useSyncExternalStore } from "react";
import { CloudOff, CloudUpload, Crosshair, Loader2, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { SERVICE_CHIPS, timeAgo } from "@/lib/civic";
import { enqueue, readQueue, subscribeQueue, syncQueue } from "@/lib/offline-queue";
import { useOnline } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Chip } from "./ui";

const EMPTY: never[] = [];
let snapshot = "";
let cached: ReturnType<typeof readQueue> = [];
function getQueue() {
  const raw = localStorage.getItem("civicreach.encounterQueue.v1") ?? "[]";
  if (raw !== snapshot) {
    snapshot = raw;
    cached = readQueue();
  }
  return cached;
}

export function EncounterLogger() {
  const online = useOnline();
  const queue = useSyncExternalStore(subscribeQueue, getQueue, () => EMPTY);
  const [chips, setChips] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [recent, setRecent] = useState<Tables<"field_encounters">[]>([]);

  async function loadRecent() {
    const { data } = await supabase.from("field_encounters").select("*").order("created_at", { ascending: false }).limit(8);
    if (data) setRecent(data);
  }

  function capture() {
    navigator.geolocation?.getCurrentPosition((p) => setGps({ lat: p.coords.latitude, lng: p.coords.longitude }), () => {}, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }

  async function sync(manual = false) {
    setSyncing(true);
    try {
      const r = await syncQueue();
      if (r.synced) toast.success(`Synced ${r.synced} encounter${r.synced > 1 ? "s" : ""}`);
      else if (manual) toast.message(navigator.onLine ? "Nothing to sync" : "Still offline — will sync when signal returns");
      void loadRecent();
    } catch {
      if (manual) toast.error("Sync failed — will retry automatically");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    capture();
    void loadRecent();
    void sync();
    const on = () => void sync();
    window.addEventListener("online", on);
    return () => window.removeEventListener("online", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function log() {
    enqueue({
      client_ref: crypto.randomUUID(),
      lat: gps?.lat ?? null,
      lng: gps?.lng ?? null,
      service_chips: chips,
      private_clinical_note: note.trim() || null,
      created_at: new Date().toISOString(),
    });
    toast.success(navigator.onLine ? "Encounter logged" : "Saved offline — queued for sync");
    setChips([]);
    setNote("");
    setShowNote(false);
    capture();
    if (navigator.onLine) void sync();
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Field encounter</h2>
          <p className="text-sm text-muted-foreground">Tap services, then log. Works with zero signal.</p>
        </div>
        <Button variant="outline" className="h-12" disabled={syncing || queue.length === 0} onClick={() => sync(true)}>
          {syncing ? <Loader2 className="animate-spin" /> : <CloudUpload />} Sync now
        </Button>
      </div>

      {queue.length > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-soft px-4 py-3 text-sm font-medium text-amber-foreground">
          <CloudOff className="size-4" /> {queue.length} encounter{queue.length > 1 ? "s" : ""} queued for sync{!online && " · waiting for signal"}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SERVICE_CHIPS.map((c) => (
          <Chip key={c} selected={chips.includes(c)} onClick={() => setChips((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))}>{c}</Chip>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Crosshair className={`size-4 ${gps ? "text-teal" : ""}`} />
        {gps ? `GPS ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : "Capturing GPS…"}
      </div>

      {showNote ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Lock className="size-3.5" /> Private clinical / vulnerability note</div>
          <Textarea className="min-h-24 text-base" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} placeholder="Visible only to outreach staff." />
        </div>
      ) : (
        <button className="mt-4 min-h-12 text-sm font-semibold text-teal" onClick={() => setShowNote(true)}>+ Add private note</button>
      )}

      <Button className="mt-4 h-16 w-full text-lg" disabled={chips.length === 0} onClick={log}>
        <CheckCircle2 /> Log encounter
      </Button>

      <h3 className="mt-10 font-semibold">Recent</h3>
      <ul className="mt-3 grid gap-2">
        {queue.map((e) => (
          <li key={e.client_ref} className="flex items-center justify-between rounded-xl border border-dashed border-amber bg-card px-4 py-3 text-sm">
            <span>{e.service_chips.join(", ")}</span>
            <Badge className="bg-amber text-amber-foreground">Queued for Sync</Badge>
          </li>
        ))}
        {recent.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <span className="min-w-0 truncate">{e.service_chips.join(", ")}</span>
            <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              {e.synced_from_offline && <Badge variant="secondary">Synced</Badge>}
              {timeAgo(e.created_at)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
