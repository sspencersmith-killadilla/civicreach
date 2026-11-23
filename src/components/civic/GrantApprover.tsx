import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useCitySettings } from "@/lib/use-city-settings";
import { enabled, type CitySettings } from "@/lib/city-settings";
import { grantRouting, labelFor, money, timeAgo, type StaffRole } from "@/lib/civic";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DR = Tables<"diversion_requests">;
type Grant = Tables<"micro_grants">;

export function GrantApprover() {
  const { profile } = useSession();
  const role: StaffRole = profile?.role ?? "outreach";
  const { settings: cfg } = useCitySettings(profile?.city_id);
  const [fund, setFund] = useState<Tables<"diversion_fund"> | null>(null);
  const [requests, setRequests] = useState<DR[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);

  const load = useCallback(async () => {
    const [f, r, g] = await Promise.all([
      supabase.from("diversion_fund").select("*").eq("active", true).order("created_at").limit(1).maybeSingle(),
      supabase.from("diversion_requests").select("*").in("status", ["new", "claimed"]).order("created_at", { ascending: false }),
      supabase.from("micro_grants").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setFund(f.data ?? null);
    setRequests(r.data ?? []);
    setGrants(g.data ?? []);
  }, []);
  useEffect(() => void load(), [load]);

  const pending = grants.filter((g) => g.status === "pending_supervisor");
  const pendingIds = new Set(pending.map((g) => g.request_id));
  const reqById = new Map(requests.map((r) => [r.id, r]));
  const pct = fund ? (Number(fund.balance) / Number(fund.total_amount)) * 100 : 0;

  async function decide(g: Grant, approve: boolean) {
    const { error } = await supabase.rpc("decide_micro_grant", { _grant_id: g.id, _approve: approve });
    if (error) { toast.error(error.message); return; }
    toast.success(approve ? `Approved ${money(Number(g.amount))}` : "Grant denied");
    void load();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Diversion micro-grants</h2>
      <p className="text-sm text-muted-foreground">
        Outreach workers auto-approve up to {money(cfg.grants.workerLimit)}. Larger grants go to a supervisor.
        {cfg.integrations.payments.instructions && <span className="mt-2 block whitespace-pre-line rounded-lg bg-muted p-2 text-foreground">Payment steps: {cfg.integrations.payments.instructions}</span>}
      </p>

      <div className="mt-5 rounded-2xl bg-primary p-5 text-primary-foreground">
        <div className="flex items-center justify-between text-sm font-semibold opacity-90">
          <span className="flex items-center gap-2"><Wallet className="size-4" /> {fund?.name ?? "Flexible Diversion Pool"}</span>
          <span>{pct.toFixed(0)}% remaining</span>
        </div>
        <div className="mt-2 text-4xl font-extrabold tracking-tight">{money(Number(fund?.balance ?? 0))}</div>
        <div className="mt-1 text-sm opacity-80">of {money(Number(fund?.total_amount ?? 0))}</div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-primary-foreground/20">
          <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {pending.length > 0 && (
        <section className="mt-8">
          <h3 className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4 text-amber" /> Awaiting supervisor ({pending.length})</h3>
          <ul className="mt-3 grid gap-3">
            {pending.map((g) => (
              <li key={g.id} className="rounded-2xl border-2 border-amber bg-amber-soft/40 p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold">{money(Number(g.amount))} → {g.payee_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {reqById.get(g.request_id)?.tracking_code} · {g.payment_method} · {timeAgo(g.created_at)}
                    </div>
                  </div>
                </div>
                {role === "supervisor" ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-12" onClick={() => decide(g, false)}>Deny</Button>
                    <Button className="h-12 bg-teal text-teal-foreground hover:bg-teal/90" onClick={() => decide(g, true)}>Approve</Button>
                  </div>
                ) : (
                  <p className="mt-2 text-sm font-medium text-amber-foreground">Waiting for a Diversion Supervisor.</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h3 className="font-semibold">Open requests ({requests.filter((r) => !pendingIds.has(r.id)).length})</h3>
        <ul className="mt-3 grid gap-3">
          {requests.filter((r) => !pendingIds.has(r.id)).map((r) => (
            <RequestCard key={r.id} r={r} role={role} onDone={load} cfg={cfg} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function RequestCard({ r, role, onDone, cfg }: { r: DR; role: StaffRole; onDone: () => void; cfg: CitySettings }) {
  const BARRIERS = cfg.intake.barriers, LIVING_SITUATIONS = cfg.intake.livingSituations;
  const [amount, setAmount] = useState(String(r.amount_requested));
  const [payee, setPayee] = useState("");
  const [method, setMethod] = useState(enabled(cfg.grants.paymentMethods)[0]?.id ?? "vendor_check");
  const [busy, setBusy] = useState(false);
  const n = Number(amount);
  const route = grantRouting(n, role, cfg.grants);
  const contact = r.contact_info as { method?: string; value?: string } | null;

  async function submit() {
    setBusy(true);
    const { data, error } = await supabase.rpc("submit_micro_grant", { _request_id: r.id, _amount: n, _payee: payee, _method: method });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(data?.status === "approved" ? `Approved ${money(n)} for ${payee}` : "Sent to supervisor for approval");
    onDone();
  }

  return (
    <li className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold">{r.tracking_code}</span>
            {r.living_situation === "eviction_7_days" && <Badge className="bg-amber text-amber-foreground">Eviction ≤7 days</Badge>}
          </div>
          <div className="mt-1 font-semibold">{labelFor(BARRIERS, r.barrier_type)} · requested {money(r.amount_requested)}</div>
          <div className="text-sm text-muted-foreground">{labelFor(LIVING_SITUATIONS, r.living_situation)} · {contact?.method}: {contact?.value}</div>
        </div>
        <span className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Input className="h-12" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} aria-label="Grant amount" />
        <Input className="h-12" placeholder="Vendor / landlord payee" value={payee} onChange={(e) => setPayee(e.target.value)} maxLength={120} />
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className="h-12 w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {enabled(cfg.grants.paymentMethods).map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button
        className={`mt-3 h-12 w-full ${route === "approve" ? "bg-teal text-teal-foreground hover:bg-teal/90" : ""}`}
        disabled={busy || route === "invalid" || payee.trim().length < 2}
        onClick={submit}
      >
        {busy && <Loader2 className="animate-spin" />}
        {route === "approve" ? `Approve ${money(n)}` : route === "supervisor_review" ? `Route ${money(n)} to supervisor` : "Enter $1–$1,000"}
      </Button>
    </li>
  );
}
