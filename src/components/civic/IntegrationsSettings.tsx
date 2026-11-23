import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendIntegrationTest } from "@/lib/integrations.functions";
import type { CitySettings, CustomProvider } from "@/lib/city-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type I = CitySettings["integrations"];
type Props = { s: CitySettings; setInt: (v: Partial<I>) => void; setNotify: (v: Partial<CitySettings["notifications"]>) => void };

const GUIDES: Record<string, string[]> = {
  resend: ["Create a free account at resend.com.", "Go to Domains → Add domain and enter your city's domain (for example notify.yourcity.gov).", "Ask your IT team to add the DNS records Resend shows, then wait until it says Verified.", "Go to API Keys → Create API key (Sending access) and paste it below.", "Enter a sender address on that domain, save settings, then press Send test email."],
  twilio: ["Create an account at twilio.com and upgrade it from trial (trial accounts only text verified numbers).", "Buy a phone number with SMS under Phone Numbers → Buy a number.", "In the US, register the number for A2P 10DLC messaging (Messaging → Regulatory compliance). This can take a few days.", "Copy the Account SID and Auth Token from the Twilio console home page and paste them below.", "Enter the sending number and staff alert numbers in +15551234567 format, save, then press Send test text."],
  uber_health: ["Sign up for an Uber Health organization account at business.uber.com/health.", "Add staff as coordinators in the Uber Health dashboard.", "Paste the dashboard link below so staff can open it from the ride window."],
  lyft_concierge: ["Request a Lyft Business Concierge account at lyft.com/business.", "Add staff as concierge users.", "Paste the Concierge booking link below."],
  paratransit: ["Get the booking phone number and any agency portal link from your transit agency.", "Enter them below; staff see them when sending a ride."],
  bill_com: ["Set up vendors (landlords, utilities) in your Bill.com account.", "Write the steps staff follow after approval below, for example: 'Email finance@city.gov the grant ID; finance pays in Bill.com within 2 days.'"],
  prepaid_cards: ["Confirm card inventory and custody rules with your finance office.", "Write the steps for issuing and logging a card below."],
  manual: ["Write the steps staff follow after a grant is approved, including who pays and how fast."],
};

function Guide({ id }: { id: string }) {
  const steps = GUIDES[id];
  if (!steps) return null;
  return <details className="rounded-lg bg-muted p-3 text-sm"><summary className="cursor-pointer font-semibold">How to connect this</summary><ol className="mt-2 list-decimal space-y-1 pl-5">{steps.map((t) => <li key={t}>{t}</li>)}</ol></details>;
}

export function IntegrationsSettings({ s, setInt, setNotify }: Props) {
  const i = s.integrations;
  const [status, setStatus] = useState<Record<string, boolean>>({});
  const loadStatus = async () => { const { data } = await supabase.rpc("city_integration_status"); setStatus((data ?? {}) as Record<string, boolean>); };
  useEffect(() => void loadStatus(), []);
  const emailReady = i.email.provider === "resend" && status["resend_api_key"] && !!i.email.fromAddress;
  const smsReady = i.sms.provider === "twilio" && status["twilio_account_sid"] && status["twilio_auth_token"] && !!i.sms.fromNumber;

  return <>
    <p className="text-sm text-muted-foreground">Connect the services your city already uses. Keys you paste are stored privately for your city and can't be viewed again. Until something is connected, staff see your details and complete the step by hand. Save settings before sending a test.</p>

    <Box title="Email alerts" ready={!!emailReady}>
      <Pick label="Email provider" value={i.email.provider} options={[["none", "Not connected"], ["resend", "Resend"]]} onChange={(v) => setInt({ email: { ...i.email, provider: v } })} />
      <Guide id={i.email.provider} />
      {i.email.provider === "resend" && <>
        <SecretField label="Resend API key" k="resend_api_key" saved={!!status["resend_api_key"]} onDone={loadStatus} />
        <Field label="Sender address (on your verified domain)" value={i.email.fromAddress} onChange={(v) => setInt({ email: { ...i.email, fromAddress: v } })} />
        <Field label="Sender name" value={i.email.fromName} onChange={(v) => setInt({ email: { ...i.email, fromName: v } })} />
        <TestButton channel="email" disabled={!emailReady} />
      </>}
      <p className="text-xs text-muted-foreground">Alerts go to the emails under Zones & alerts.</p>
    </Box>

    <Box title="Text messages" ready={!!smsReady}>
      <Pick label="Text provider" value={i.sms.provider} options={[["none", "Not connected"], ["twilio", "Twilio"]]} onChange={(v) => setInt({ sms: { ...i.sms, provider: v } })} />
      <Guide id={i.sms.provider} />
      {i.sms.provider === "twilio" && <>
        <SecretField label="Twilio Account SID" k="twilio_account_sid" saved={!!status["twilio_account_sid"]} onDone={loadStatus} />
        <SecretField label="Twilio Auth Token" k="twilio_auth_token" saved={!!status["twilio_auth_token"]} onDone={loadStatus} />
        <Field label="Sending phone number" value={i.sms.fromNumber} onChange={(v) => setInt({ sms: { ...i.sms, fromNumber: v } })} />
        <Field label="Staff alert phone numbers (comma separated)" value={s.notifications.alertPhones} onChange={(v) => setNotify({ alertPhones: v })} />
        <TestButton channel="sms" disabled={!smsReady} />
      </>}
    </Box>

    <Box title="Rides" ready={i.rides.provider !== "none" && !!(i.rides.bookingUrl || i.rides.phone)}>
      <Pick label="Ride provider" value={i.rides.provider} options={[["none", "City van only"], ["uber_health", "Uber Health"], ["lyft_concierge", "Lyft Concierge"], ["paratransit", "Municipal paratransit"], ["other", "Other"]]} onChange={(v) => setInt({ rides: { ...i.rides, provider: v } })} />
      <Guide id={i.rides.provider} />
      <Field label="Booking link for staff" value={i.rides.bookingUrl} onChange={(v) => setInt({ rides: { ...i.rides, bookingUrl: v } })} />
      <Field label="Booking phone" value={i.rides.phone} onChange={(v) => setInt({ rides: { ...i.rides, phone: v } })} />
    </Box>

    <Box title="Grant payments" ready={i.payments.instructions.trim().length > 10}>
      <Pick label="Payment provider" value={i.payments.provider} options={[["manual", "Manual (finance office)"], ["bill_com", "Bill.com"], ["prepaid_cards", "Prepaid card program"], ["other", "Other"]]} onChange={(v) => setInt({ payments: { ...i.payments, provider: v } })} />
      <Guide id={i.payments.provider} />
      <Area label="Payment steps shown after approval" value={i.payments.instructions} onChange={(v) => setInt({ payments: { ...i.payments, instructions: v } })} />
    </Box>

    <fieldset className="grid gap-3 rounded-xl border border-border p-3"><legend className="px-1 font-semibold">Your own services & providers</legend>
      <p className="text-sm text-muted-foreground">Add any local partner — shelters, meal programs, interpreters, ride or payment vendors. Staff see these in the console with your instructions.</p>
      {i.custom.map((c, n) => <CustomRow key={n} c={c} onChange={(v) => setInt({ custom: i.custom.map((x, j) => j === n ? v : x) })} onRemove={() => setInt({ custom: i.custom.filter((_, j) => j !== n) })} />)}
      <Button variant="outline" className="h-12 w-fit" onClick={() => setInt({ custom: [...i.custom, { name: "", kind: "", contact: "", url: "", instructions: "" }] })}><Plus /> Add service or provider</Button>
    </fieldset>
  </>;
}

function CustomRow({ c, onChange, onRemove }: { c: CustomProvider; onChange: (c: CustomProvider) => void; onRemove: () => void }) {
  return <div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
    <Input className="h-12" placeholder="Name" value={c.name} onChange={(e) => onChange({ ...c, name: e.target.value })} />
    <Input className="h-12" placeholder="Type (shelter, rides, interpreter…)" value={c.kind} onChange={(e) => onChange({ ...c, kind: e.target.value })} />
    <Input className="h-12" placeholder="Phone or email" value={c.contact} onChange={(e) => onChange({ ...c, contact: e.target.value })} />
    <Input className="h-12" placeholder="Website or booking link" value={c.url} onChange={(e) => onChange({ ...c, url: e.target.value })} />
    <Textarea className="sm:col-span-2" placeholder="How staff use this service" value={c.instructions} onChange={(e) => onChange({ ...c, instructions: e.target.value })} />
    <Button variant="ghost" className="h-12 w-fit" onClick={onRemove}><Trash2 /> Remove</Button>
  </div>;
}

function Box({ title, ready, children }: { title: string; ready: boolean; children: React.ReactNode }) {
  return <fieldset className="grid gap-3 rounded-xl border border-border p-3"><legend className="flex items-center gap-2 px-1 font-semibold">{ready ? <CheckCircle2 className="size-4 text-teal" /> : <Circle className="size-4 text-muted-foreground" />}{title}<span className="text-xs font-normal text-muted-foreground">{ready ? "Connected" : "Not connected"}</span></legend>{children}</fieldset>;
}

function SecretField({ label, k, saved, onDone }: { label: string; k: string; saved: boolean; onDone: () => void }) {
  const [v, setV] = useState(""); const [busy, setBusy] = useState(false);
  const id = k;
  async function run(value: string) {
    setBusy(true);
    const { error } = await supabase.rpc("set_city_integration_secret", { _key: k, _value: value });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setV(""); toast.success(value ? `${label} saved` : `${label} removed`); onDone();
  }
  return <div className="grid gap-2"><Label htmlFor={id}>{label} {saved && <span className="text-xs text-teal">· saved</span>}</Label>
    <div className="flex gap-2"><Input id={id} type="password" autoComplete="off" className="h-12" placeholder={saved ? "•••••••• (paste to replace)" : "Paste here"} value={v} onChange={(e) => setV(e.target.value)} />
      <Button className="h-12" disabled={busy || !v.trim()} onClick={() => void run(v.trim())}>Save</Button>
      {saved && <Button variant="outline" className="h-12" disabled={busy} onClick={() => void run("")}>Remove</Button>}</div></div>;
}

function TestButton({ channel, disabled }: { channel: "email" | "sms"; disabled: boolean }) {
  const [busy, setBusy] = useState(false);
  return <Button variant="outline" className="h-12 w-fit" disabled={disabled || busy} onClick={async () => {
    setBusy(true);
    try { const { result } = await sendIntegrationTest({ data: { channel } }); result === "sent" ? toast.success("Test sent — check your inbox or phone") : toast.error(`Test ${result}`); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Test failed"); }
    setBusy(false);
  }}>{busy ? <Loader2 className="animate-spin" /> : <Send />} Send test {channel === "email" ? "email" : "text"}</Button>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = "int-" + label.replace(/\W+/g, "-");
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label><Input id={id} className="h-12" value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}
function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = "int-" + label.replace(/\W+/g, "-");
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label><Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}
function Pick({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  const id = "int-" + label.replace(/\W+/g, "-");
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label><select id={id} className="h-12 rounded-md border border-input bg-background px-3" value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>;
}
