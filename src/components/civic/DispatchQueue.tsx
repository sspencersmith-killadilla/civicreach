import { useCallback, useEffect, useMemo, useState } from "react";
import { Car, CheckCircle2, Home, Loader2, MapPin, Navigation, RefreshCw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useCitySettings } from "@/lib/use-city-settings";
import { distanceKm, labelFor, money, timeAgo, urgencyScore } from "@/lib/civic";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChoiceButton } from "./ui";

type WC = Tables<"wellness_checks">;
type DR = Tables<"diversion_requests">;
type Item = { kind: "wellness"; row: WC; score: number; km: number | null } | { kind: "diversion"; row: DR; score: number; km: number | null };

export function DispatchQueue() {
  const { session, profile: staff } = useSession();
  const { settings: cfg } = useCitySettings(staff?.city_id);
  const BARRIERS = cfg.intake.barriers, LIVING_SITUATIONS = cfg.intake.livingSituations, WELLNESS_NEEDS = cfg.intake.wellnessNeeds;
  const [checks, setChecks] = useState<WC[]>([]);
  const [requests, setRequests] = useState<DR[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [ride, setRide] = useState<WC | null>(null);

  const load = useCallback(async () => {
    const [w, d] = await Promise.all([
      supabase.from("wellness_checks").select("*").neq("status", "resolved").order("created_at", { ascending: false }),
      supabase.from("diversion_requests").select("*").in("status", ["new", "claimed"]).order("created_at", { ascending: false }),
    ]);
    if (w.data) setChecks(w.data);
    if (d.data) setRequests(d.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    navigator.geolocation?.getCurrentPosition((p) => setMe({ lat: p.coords.latitude, lng: p.coords.longitude }), () => {}, { timeout: 8000 });
    const ch = supabase
      .channel(`dispatch-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "wellness_checks" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "diversion_requests" }, () => void load())
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, [load]);

  const items = useMemo<Item[]>(() => {
    const km = (lat: number | null, lng: number | null) => (me && lat != null && lng != null ? distanceKm(me, { lat, lng }) : null);
    const all: Item[] = [
      ...checks.map((row) => ({ kind: "wellness" as const, row, score: urgencyScore(row.urgency_tags) + (row.status === "unassigned" ? 2 : 0), km: km(row.lat, row.lng) })),
      ...requests.map((row) => ({ kind: "diversion" as const, row, score: urgencyScore([row.living_situation]) + (row.status === "new" ? 1 : 0), km: null })),
    ];
    return all.sort((a, b) => b.score - a.score || (a.km ?? 99) - (b.km ?? 99));
  }, [checks, requests, me]);

  async function setWellness(row: WC, status: WC["status"]) {
    const { error } = await supabase.from("wellness_checks").update({ status, assigned_worker_id: session?.user.id ?? null }).eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "en_route" ? "Claimed — you're en route" : "Marked resolved");
    void load();
  }
  async function claimRequest(row: DR) {
    const { error } = await supabase.from("diversion_requests").update({ status: "claimed", assigned_worker_id: session?.user.id ?? null }).eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Claimed ${row.tracking_code}`);
    void load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Live dispatch queue</h2>
          <p className="text-sm text-muted-foreground">{items.length} open · sorted by urgency{me ? " and distance" : ""} · updates live</p>
        </div>
        <Button variant="outline" size="icon" className="size-12" onClick={() => void load()} aria-label="Refresh"><RefreshCw /></Button>
      </div>
      {loading ? (
        <div className="mt-10 grid place-items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : (
        <ul className="mt-5 grid gap-3">
          {items.map((it) =>
            it.kind === "wellness" ? (
              <li key={it.row.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-primary text-primary-foreground">311 Wellness</Badge>
                      {it.row.urgency_tags.some((t) => t === "medical_mobility" || t === "heat_cold") && (
                        <Badge className="bg-amber text-amber-foreground"><TriangleAlert className="size-3" /> Urgent</Badge>
                      )}
                      {it.row.status === "en_route" && <Badge className="bg-teal text-teal-foreground">En route</Badge>}
                      <span className="font-mono text-xs text-muted-foreground">{it.row.tracking_code}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 font-semibold"><MapPin className="size-4 shrink-0 text-teal" /> {it.row.location_text}</div>
                    {it.row.description && <p className="mt-1 text-sm text-muted-foreground">{it.row.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {it.row.urgency_tags.map((t) => <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{labelFor(WELLNESS_NEEDS, t)}</span>)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    {timeAgo(it.row.created_at)}
                    {it.km != null && <div className="font-semibold text-foreground">{it.km.toFixed(1)} km</div>}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {it.row.status === "unassigned" ? (
                    <Button className="col-span-2 h-12 bg-teal text-teal-foreground hover:bg-teal/90" onClick={() => setWellness(it.row, "en_route")}>Claim & En Route</Button>
                  ) : (
                    <Button className="col-span-2 h-12" onClick={() => setWellness(it.row, "resolved")}><CheckCircle2 /> Resolve</Button>
                  )}
                  <Button asChild variant="outline" className="h-12">
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${it.row.lat != null ? `${it.row.lat},${it.row.lng}` : encodeURIComponent(it.row.location_text)}`}
                    >
                      <Navigation /> Directions
                    </a>
                  </Button>
                  <Button variant="outline" className="h-12" onClick={() => setRide(it.row)}><Car /> Ride</Button>
                </div>
              </li>
            ) : (
              <li key={it.row.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary"><Home className="size-3" /> Diversion</Badge>
                      {it.row.living_situation === "eviction_7_days" && <Badge className="bg-amber text-amber-foreground">Eviction ≤7 days</Badge>}
                      {it.row.status === "claimed" && <Badge className="bg-teal text-teal-foreground">Claimed</Badge>}
                      <span className="font-mono text-xs text-muted-foreground">{it.row.tracking_code}</span>
                    </div>
                    <div className="mt-2 font-semibold">{labelFor(BARRIERS, it.row.barrier_type)} · {money(it.row.amount_requested)}</div>
                    <p className="text-sm text-muted-foreground">{labelFor(LIVING_SITUATIONS, it.row.living_situation)}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(it.row.created_at)}</span>
                </div>
                {it.row.status === "new" && (
                  <Button className="mt-4 h-12 w-full" variant="outline" onClick={() => claimRequest(it.row)}>Claim for navigation</Button>
                )}
              </li>
            ),
          )}
          {items.length === 0 && <li className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">Queue is clear. Nice work.</li>}
        </ul>
      )}
      <RideDialog check={ride} onClose={() => setRide(null)} />
    </div>
  );
}

function RideDialog({ check, onClose }: { check: WC | null; onClose: () => void }) {
  const { session, profile } = useSession();
  const [type, setType] = useState("outreach_van");
  const { settings: cfg } = useCitySettings(profile?.city_id);
  const SERVICE_HUBS = cfg.hubs.map((h) => h.name).filter(Boolean);
  const [dest, setDest] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function dispatch() {
    if (!check || !session || !profile?.city_id) return;
    setBusy(true);
    const { error } = await supabase.from("ride_dispatches").insert({
      city_id: profile.city_id,
      wellness_check_id: check.id,
      ride_type: type,
      pickup_lat: check.lat,
      pickup_lng: check.lng,
      destination: dest || SERVICE_HUBS[0] || "Other",
      dispatched_by: session.user.id,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${type === "outreach_van" ? "Outreach van" : "Ride-share voucher"} dispatched to ${dest}`);
    onClose();
  }

  return (
    <Dialog open={!!check} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dispatch ride</DialogTitle>
          <DialogDescription>
            Pickup: {check?.location_text}
            {check?.lat != null && ` (${check.lat.toFixed(4)}, ${check.lng?.toFixed(4)})`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <ChoiceButton selected={type === "outreach_van"} onClick={() => setType("outreach_van")}>Outreach van</ChoiceButton>
          <ChoiceButton selected={type === "rideshare_voucher"} onClick={() => setType("rideshare_voucher")}>Municipal ride-share voucher</ChoiceButton>
        </div>
        <div className="mt-2 text-sm font-semibold">Destination</div>
        <div className="grid gap-2">
          {SERVICE_HUBS.map((h) => <ChoiceButton key={h} selected={(dest || SERVICE_HUBS[0]) === h} onClick={() => setDest(h)}>{h}</ChoiceButton>)}
        </div>
        {(cfg.integrations.rides.bookingUrl || cfg.integrations.rides.phone) && <div className="rounded-xl bg-muted p-3 text-sm">Book the ride with your city's provider: {cfg.integrations.rides.bookingUrl && <a className="font-semibold text-teal underline" href={cfg.integrations.rides.bookingUrl} target="_blank" rel="noreferrer">open booking</a>}{cfg.integrations.rides.bookingUrl && cfg.integrations.rides.phone && " · "}{cfg.integrations.rides.phone && <a className="font-semibold text-teal underline" href={`tel:${cfg.integrations.rides.phone}`}>{cfg.integrations.rides.phone}</a>}</div>}
        <Button className="mt-2 h-12" disabled={busy} onClick={dispatch}>{busy && <Loader2 className="animate-spin" />} Confirm dispatch</Button>
      </DialogContent>
    </Dialog>
  );
}
