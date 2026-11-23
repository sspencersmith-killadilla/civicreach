import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, Plus, Rocket, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useSession } from "@/lib/session";
import { useCitySettings } from "@/lib/use-city-settings";
import { newOption, readiness, validGrantLimits, type CitySettings, type Option } from "@/lib/city-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { IntegrationsSettings } from "./IntegrationsSettings";

const SECTIONS = [
  ["profile", "City profile"], ["hours", "Hours"], ["emergency", "Emergency"], ["targets", "Response targets"],
  ["intake", "Intake forms"], ["grants", "Grant rules"], ["hubs", "Service hubs"], ["team", "Zones & alerts"], ["privacy", "Privacy"], ["languages", "Languages"], ["integrations", "Integrations"],
] as const;
type Section = (typeof SECTIONS)[number][0];

export function CitySettingsPanel() {
  const { profile } = useSession();
  const { settings, goLive, loaded, reload } = useCitySettings(profile?.city_id);
  const [s, setS] = useState<CitySettings>(settings);
  const [live, setLive] = useState(goLive);
  const [section, setSection] = useState<Section>("profile");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setS(settings); setLive(goLive); }, [settings, goLive]);

  const checks = readiness(s);
  const done = checks.filter((c) => c.done).length;
  const ready = done === checks.length;
  const set = <K extends keyof CitySettings>(k: K, v: Partial<CitySettings[K]>) => setS((p) => ({ ...p, [k]: Array.isArray(p[k]) ? v : { ...(p[k] as object), ...v } }));

  async function save(nextLive = live) {
    if (!validGrantLimits(s.grants)) { toast.error("Check grant limits: minimum ≤ worker limit ≤ maximum."); return; }
    setBusy(true);
    const { error } = await supabase.rpc("update_city_settings", { _settings: s as unknown as Json, _go_live: nextLive });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(nextLive !== goLive ? (nextLive ? "Resident link is now live" : "Resident link set back to pilot") : "Settings saved");
    void reload();
  }

  if (!loaded) return <div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return <div>
    <h2 className="text-2xl font-bold tracking-tight">City settings</h2>
    <p className="text-sm text-muted-foreground">Everything residents and staff see for {profile?.city?.name ?? "your city"}. Changes apply immediately after saving.</p>

    <div className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-3"><div className="font-semibold">Launch readiness</div><div className="text-sm font-semibold text-teal">{done}/{checks.length}</div></div>
      <div className="mt-3 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-teal transition-all" style={{ width: `${(done / checks.length) * 100}%` }} /></div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">{checks.map((c) => <li key={c.id} className="flex items-center gap-2 text-sm">{c.done ? <CheckCircle2 className="size-4 text-teal" /> : <Circle className="size-4 text-muted-foreground" />}{c.label}</li>)}</ul>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <span className="text-sm">Resident link: <b>{goLive ? "Live" : "Pilot (not public)"}</b></span>
        {goLive ? <Button variant="outline" className="h-12" disabled={busy} onClick={() => { setLive(false); void save(false); }}>Return to pilot</Button>
          : <Button className="h-12" disabled={busy || !ready} onClick={() => { setLive(true); void save(true); }}><Rocket /> Go live</Button>}
        {!ready && !goLive && <span className="text-xs text-muted-foreground">Finish every item to go live.</span>}
      </div>
    </div>

    <div className="mt-5 flex gap-2 overflow-x-auto pb-2">{SECTIONS.map(([id, label]) => <button key={id} onClick={() => setSection(id)} className={`min-h-12 shrink-0 rounded-full px-4 text-sm font-semibold ${section === id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{label}</button>)}</div>

    <div className="mt-3 grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
      {section === "profile" && <>
        <Field label="Public contact phone" value={s.profile.contactPhone} onChange={(v) => set("profile", { contactPhone: v })} />
        <Field label="Public contact email" value={s.profile.contactEmail} onChange={(v) => set("profile", { contactEmail: v })} />
        <Field label="City program website" value={s.profile.website} onChange={(v) => set("profile", { website: v })} />
        <Field label="Time zone (e.g. America/Chicago)" value={s.profile.timeZone} onChange={(v) => set("profile", { timeZone: v })} />
      </>}
      {section === "hours" && <>
        <Toggle label="Outreach available 24/7" checked={s.hours.alwaysOpen} onChange={(v) => set("hours", { alwaysOpen: v })} />
        {!s.hours.alwaysOpen && s.hours.week.map((d, i) => <div key={d.day} className="grid grid-cols-[3rem_1fr_1fr_auto] items-center gap-2">
          <span className="font-semibold">{d.day}</span>
          <Input type="time" className="h-12" value={d.open} disabled={d.closed} onChange={(e) => set("hours", { week: s.hours.week.map((x, j) => j === i ? { ...x, open: e.target.value } : x) })} />
          <Input type="time" className="h-12" value={d.close} disabled={d.closed} onChange={(e) => set("hours", { week: s.hours.week.map((x, j) => j === i ? { ...x, close: e.target.value } : x) })} />
          <label className="flex items-center gap-2 text-sm"><Switch checked={d.closed} onCheckedChange={(v) => set("hours", { week: s.hours.week.map((x, j) => j === i ? { ...x, closed: v } : x) })} />Closed</label>
        </div>)}
        <Area label="After-hours message to residents" value={s.hours.afterHoursMessage} onChange={(v) => set("hours", { afterHoursMessage: v })} />
      </>}
      {section === "emergency" && <>
        <Field label="Emergency number" value={s.emergency.emergencyNumber} onChange={(v) => set("emergency", { emergencyNumber: v })} />
        <Field label="Crisis line" value={s.emergency.crisisLine} onChange={(v) => set("emergency", { crisisLine: v })} />
        <Area label="Escalation rules shown to staff (when to call EMS, crisis team, etc.)" value={s.emergency.escalationRules} onChange={(v) => set("emergency", { escalationRules: v })} />
        <Area label="Public disclaimer" value={s.emergency.disclaimer} onChange={(v) => set("emergency", { disclaimer: v })} />
      </>}
      {section === "targets" && <>
        <Num label="Urgent wellness response target (minutes)" value={s.targets.urgentMinutes} onChange={(v) => set("targets", { urgentMinutes: v })} />
        <Num label="Standard wellness response target (minutes)" value={s.targets.standardMinutes} onChange={(v) => set("targets", { standardMinutes: v })} />
        <Field label="Housing request follow-up promise" value={s.targets.housingFollowUp} onChange={(v) => set("targets", { housingFollowUp: v })} />
      </>}
      {section === "intake" && <>
        <Options title="Living situations" list={s.intake.livingSituations} onChange={(l) => set("intake", { livingSituations: l })} />
        <Options title="Barriers" list={s.intake.barriers} onChange={(l) => set("intake", { barriers: l })} />
        <Options title="Wellness needs" list={s.intake.wellnessNeeds} onChange={(l) => set("intake", { wellnessNeeds: l })} />
        <Options title="Field service chips" list={s.intake.serviceChips} onChange={(l) => set("intake", { serviceChips: l })} />
        <Options title="Document types" list={s.intake.docTypes} onChange={(l) => set("intake", { docTypes: l })} />
      </>}
      {section === "grants" && <>
        <Num label="Minimum grant (USD)" value={s.grants.min} onChange={(v) => set("grants", { min: v })} />
        <Num label="Maximum grant (USD)" value={s.grants.max} onChange={(v) => set("grants", { max: v })} />
        <Num label="Outreach worker approval limit (USD)" value={s.grants.workerLimit} onChange={(v) => set("grants", { workerLimit: v })} />
        <Options title="Payment methods" list={s.grants.paymentMethods} onChange={(l) => set("grants", { paymentMethods: l })} />
      </>}
      {section === "languages" && <>
        <Toggle label="Offer Spanish on resident pages" checked={s.languages.spanish} onChange={(v) => set("languages", { spanish: v })} />
        <p className="text-sm text-muted-foreground">Residents see an Español button. Option labels you add above appear as you typed them.</p>
      </>}
      {section === "integrations" && <IntegrationsSettings s={s} setInt={(v) => set("integrations", v)} setNotify={(v) => set("notifications", v)} />}
      {section === "hubs" && <>
        {s.hubs.map((h, i) => <div key={i} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <Input className="h-12" placeholder="Name" value={h.name} onChange={(e) => setS((p) => ({ ...p, hubs: p.hubs.map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))} />
          <Input className="h-12" placeholder="Address" value={h.address} onChange={(e) => setS((p) => ({ ...p, hubs: p.hubs.map((x, j) => j === i ? { ...x, address: e.target.value } : x) }))} />
          <Input className="h-12" placeholder="Hours" value={h.hours} onChange={(e) => setS((p) => ({ ...p, hubs: p.hubs.map((x, j) => j === i ? { ...x, hours: e.target.value } : x) }))} />
          <Button variant="ghost" className="h-12" aria-label="Remove hub" onClick={() => setS((p) => ({ ...p, hubs: p.hubs.filter((_, j) => j !== i) }))}><Trash2 /></Button>
        </div>)}
        <Button variant="outline" className="h-12 w-fit" onClick={() => setS((p) => ({ ...p, hubs: [...p.hubs, { name: "", address: "", hours: "" }] }))}><Plus /> Add hub</Button>
      </>}
      {section === "team" && <>
        <Field label="Team zones (comma separated)" value={s.zones.join(", ")} onChange={(v) => setS((p) => ({ ...p, zones: v.split(",").map((z) => z.trim()).filter(Boolean) }))} />
        <Field label="Alert emails for new requests (comma separated)" value={s.notifications.alertEmails} onChange={(v) => set("notifications", { alertEmails: v })} />
        <Toggle label="Only alert for urgent wellness checks" checked={s.notifications.urgentOnly} onChange={(v) => set("notifications", { urgentOnly: v })} />
      </>}
      {section === "privacy" && <>
        <Area label="Consent wording" value={s.privacy.consent} onChange={(v) => set("privacy", { consent: v })} />
        <Num label="Keep records for (days)" value={s.privacy.retentionDays} onChange={(v) => set("privacy", { retentionDays: v })} />
        <Field label="Public-records / privacy contact" value={s.privacy.recordsContact} onChange={(v) => set("privacy", { recordsContact: v })} />
      </>}
      <Button className="h-12 w-fit" disabled={busy} onClick={() => void save()}>{busy ? <Loader2 className="animate-spin" /> : <Save />} Save settings</Button>
    </div>
  </div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = label.replace(/\W+/g, "-");
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label><Input id={id} className="h-12" value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}
function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const id = label.replace(/\W+/g, "-");
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label><Input id={id} type="number" min={0} className="h-12" value={value} onChange={(e) => onChange(Number(e.target.value))} /></div>;
}
function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = label.replace(/\W+/g, "-");
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label><Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}
function Pick({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  const id = label.replace(/\W+/g, "-") + options[0]?.[0];
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label><select id={id} className="h-12 rounded-md border border-input bg-background px-3" value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex min-h-12 items-center gap-3"><Switch checked={checked} onCheckedChange={onChange} />{label}</label>;
}
function Options({ title, list, onChange }: { title: string; list: Option[]; onChange: (l: Option[]) => void }) {
  const [draft, setDraft] = useState("");
  return <fieldset className="rounded-xl border border-border p-3"><legend className="px-1 font-semibold">{title}</legend>
    <div className="grid gap-2">{list.map((o, i) => <div key={o.id} className="flex items-center gap-2">
      <Switch checked={o.enabled} aria-label={`Show ${o.label}`} onCheckedChange={(v) => onChange(list.map((x, j) => j === i ? { ...x, enabled: v } : x))} />
      <Input className="h-12" value={o.label} onChange={(e) => onChange(list.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
    </div>)}</div>
    <div className="mt-2 flex gap-2"><Input className="h-12" placeholder="Add option" value={draft} onChange={(e) => setDraft(e.target.value)} />
      <Button variant="outline" className="h-12" disabled={!draft.trim() || list.some((o) => o.id === newOption(draft).id)} onClick={() => { onChange([...list, newOption(draft)]); setDraft(""); }}><Plus /></Button></div>
  </fieldset>;
}
