import { useEffect, useState } from "react";
import { Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { useCitySettings } from "@/lib/use-city-settings";
import { money } from "@/lib/civic";
import { toCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";

type Stats = { housing: Record<string, number>; wellness: Record<string, number>; grantsApproved: number; grantsPending: number; encounters30: number };
type Audit = { id: string; action: string; details: unknown; created_at: string };

// Exports leave out free-text clinical notes and resident contact details by design.
const EXPORTS = [
  { table: "diversion_requests", label: "Housing requests", cols: "tracking_code,living_situation,barrier_type,amount_requested,status,created_at" },
  { table: "wellness_checks", label: "Wellness checks", cols: "tracking_code,location_text,urgency_tags,status,created_at" },
  { table: "micro_grants", label: "Grants", cols: "amount,payee_name,payment_method,status,created_at" },
  { table: "field_encounters", label: "Field encounters", cols: "service_chips,synced_from_offline,created_at" },
] as const;

const count = (rows: { status: string }[]) => rows.reduce<Record<string, number>>((a, r) => ({ ...a, [r.status]: (a[r.status] ?? 0) + 1 }), {});

export function ReportsPanel() {
  const { profile } = useSession();
  const { settings } = useCitySettings(profile?.city_id);
  const [stats, setStats] = useState<Stats | null>(null);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    const [d, w, g, e, a] = await Promise.all([
      supabase.from("diversion_requests").select("status"),
      supabase.from("wellness_checks").select("status"),
      supabase.from("micro_grants").select("amount,status"),
      supabase.from("field_encounters").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabase.from("audit_log").select("id,action,details,created_at").order("created_at", { ascending: false }).limit(50),
    ]);
    const grants = g.data ?? [];
    setStats({
      housing: count(d.data ?? []), wellness: count(w.data ?? []),
      grantsApproved: grants.filter((x) => x.status === "approved" || x.status === "paid").reduce((s, x) => s + Number(x.amount), 0),
      grantsPending: grants.filter((x) => x.status === "pending_supervisor").length,
      encounters30: e.count ?? 0,
    });
    setAudit((a.data ?? []) as Audit[]);
  }
  useEffect(() => { void load(); }, []);

  async function exportCsv(x: (typeof EXPORTS)[number]) {
    setBusy(x.table);
    const { data, error } = await supabase.from(x.table).select(x.cols).order("created_at", { ascending: false }).limit(10000);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    const rows = (data ?? []) as unknown as Record<string, unknown>[];
    if (!rows.length) { toast.info("Nothing to export yet"); return; }
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: `${x.table}-${new Date().toISOString().slice(0, 10)}.csv` });
    link.click(); URL.revokeObjectURL(url);
  }

  async function purge() {
    if (!confirm(`Delete closed records older than ${settings.privacy.retentionDays} days? Records tied to grants are kept.`)) return;
    setBusy("purge");
    const { data, error } = await supabase.rpc("purge_my_city_records");
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    const r = data as { housing?: number; wellness?: number; encounters?: number; rides?: number };
    toast.success(`Removed ${r.housing ?? 0} housing, ${r.wellness ?? 0} wellness, ${r.encounters ?? 0} encounter and ${r.rides ?? 0} ride records`);
    void load();
  }

  if (!stats) return <div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

  return <div>
    <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
    <p className="text-sm text-muted-foreground">Program totals for {profile?.city?.name ?? "your city"}.</p>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Housing requests" value={sum(stats.housing)} sub={Object.entries(stats.housing).map(([k, v]) => `${k} ${v}`).join(" · ")} />
      <Stat label="Wellness checks" value={sum(stats.wellness)} sub={Object.entries(stats.wellness).map(([k, v]) => `${k.replace("_", " ")} ${v}`).join(" · ")} />
      <Stat label="Grants approved" value={money(stats.grantsApproved)} sub={`${stats.grantsPending} awaiting supervisor`} />
      <Stat label="Encounters, last 30 days" value={stats.encounters30} />
    </div>

    <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="font-semibold">Export data (CSV)</h3>
      <p className="text-sm text-muted-foreground">Clinical notes and resident contact details are never included.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{EXPORTS.map((x) => <Button key={x.table} variant="outline" className="h-12 justify-start" disabled={busy !== null} onClick={() => exportCsv(x)}>{busy === x.table ? <Loader2 className="animate-spin" /> : <Download />}{x.label}</Button>)}</div>
    </section>

    <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="font-semibold">Record retention</h3>
      <p className="text-sm text-muted-foreground">Closed records older than {settings.privacy.retentionDays} days are removed automatically each night once your city is live. Grant records are always kept.</p>
      <Button variant="outline" className="mt-3 h-12" disabled={busy !== null} onClick={purge}>{busy === "purge" ? <Loader2 className="animate-spin" /> : <Trash2 />}Run cleanup now</Button>
    </section>

    <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="font-semibold">Activity log</h3>
      {audit.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No activity yet.</p> :
        <ul className="mt-3 divide-y divide-border text-sm">{audit.map((a) => <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2"><span className="font-medium">{a.action}</span><span className="text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span></li>)}</ul>}
    </section>
  </div>;
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return <div className="rounded-2xl border border-border bg-card p-4 shadow-card"><div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-bold">{value}</div>{sub && <div className="mt-1 text-xs capitalize text-muted-foreground">{sub}</div>}</div>;
}
