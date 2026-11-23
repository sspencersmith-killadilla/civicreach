import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { makeTrackingCode, money } from "@/lib/civic";
import { enabled } from "@/lib/city-settings";
import { usePublicCityConfig } from "@/lib/use-city-settings";
import { looksAutomated } from "@/lib/bot-guard";
import { useLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/civic/LanguageToggle";
import type { CitySummary } from "@/lib/cities";
import { ChoiceButton, TrackingCode } from "@/components/civic/ui";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CONTACTS = [
  { id: "phone", label: "Phone call or text", placeholder: "(555) 123-4567" },
  { id: "email", label: "Email", placeholder: "you@example.com" },
  { id: "hub", label: "Meet me at a local library or hub", placeholder: "e.g. Central Library, weekdays after 2pm" },
] as const;

export function HelpRequest({ city }: { city: CitySummary }) {
  const { settings: cfg } = usePublicCityConfig(city.slug);
  const LIVING_SITUATIONS = enabled(cfg.intake.livingSituations), BARRIERS = enabled(cfg.intake.barriers);
  const [step, setStep] = useState(0);
  const [living, setLiving] = useState("");
  const [barrier, setBarrier] = useState("");
  const [amount, setAmount] = useState(250);
  const [method, setMethod] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [startedAt] = useState(() => Date.now());
  const { lang, setLang, t } = useLang(cfg.languages.spanish);
  const [code, setCode] = useState<string | null>(null);
  const canNext = [living, barrier, amount >= cfg.grants.min && amount <= cfg.grants.max, method && contact.trim().length > 2][step];

  async function submit() {
    setBusy(true);
    const tracking = makeTrackingCode("D");
    if (looksAutomated(honeypot, startedAt)) { setBusy(false); setCode(tracking); return; }
    const { error } = await supabase.from("diversion_requests").insert({
      city_id: city.id,
      tracking_code: tracking,
      living_situation: living,
      barrier_type: barrier,
      amount_requested: amount,
      contact_info: { method, value: contact.trim() },
    });
    setBusy(false);
    if (error) { toast.error("We couldn't send your request. Please try again."); return; }
    setCode(tracking);
  }

  if (code) return (
    <Shell>
      <h1 className="text-3xl font-bold tracking-tight">{t("Request received")}</h1>
      <p className="mt-2 text-muted-foreground">A {city.name} housing navigator will reach out using the contact method you chose, usually {cfg.targets.housingFollowUp}.</p>
      <div className="mt-6"><TrackingCode code={code} t={t} /></div>
      <Link to="/c/$citySlug" params={{ citySlug: city.slug }} className="mt-6 flex min-h-12 items-center justify-center rounded-xl border border-border font-semibold hover:bg-muted">Back to {city.name}</Link>
    </Shell>
  );

  return (
    <Shell>
      <div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm font-semibold text-teal">{city.name} rapid housing help</p>{cfg.languages.spanish && <LanguageToggle lang={lang} setLang={setLang} />}</div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      <div className="flex items-center gap-2" aria-label={`Step ${step + 1} of 4`}>
        {[0, 1, 2, 3].map((i) => <span key={i} className={`h-2 flex-1 rounded-full ${i <= step ? "bg-teal" : "bg-muted"}`} />)}
      </div>
      <p className="mt-4 text-sm font-semibold text-muted-foreground">Step {step + 1} of 4</p>
      {step === 0 && <Step title={t("Where are you staying right now?")}>{LIVING_SITUATIONS.map((o) => <ChoiceButton key={o.id} selected={living === o.id} onClick={() => setLiving(o.id)}>{o.label}</ChoiceButton>)}</Step>}
      {step === 1 && <Step title={t("What's the biggest thing in the way?")}>{BARRIERS.map((o) => <ChoiceButton key={o.id} selected={barrier === o.id} onClick={() => setBarrier(o.id)}>{o.label}</ChoiceButton>)}</Step>}
      {step === 2 && (
        <Step title={t("About how much would solve it?")}>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-center text-5xl font-extrabold tracking-tight">{money(amount)}</div>
            <Slider className="mt-8" min={cfg.grants.min} max={cfg.grants.max} step={10} value={[amount]} onValueChange={(v) => setAmount(v[0] ?? cfg.grants.min)} aria-label="Amount needed" />
            <div className="mt-3 flex justify-between text-sm text-muted-foreground"><span>{money(cfg.grants.min)}</span><span>{money(cfg.grants.max)}</span></div>
          </div>
          <p className="text-sm text-muted-foreground">A best guess is fine — your navigator will confirm the details.</p>
        </Step>
      )}
      {step === 3 && (
        <Step title={t("How can we safely reach you?")}>
          {CONTACTS.map((o) => <ChoiceButton key={o.id} selected={method === o.id} onClick={() => setMethod(o.id)}>{o.label}</ChoiceButton>)}
          {method && <Input autoFocus className="h-14 text-base" value={contact} onChange={(e) => setContact(e.target.value)} placeholder={CONTACTS.find((c) => c.id === method)?.placeholder} maxLength={200} />}
        </Step>
      )}
      <div className="mt-8 flex gap-3">
        {step > 0 && <Button variant="outline" className="h-14 flex-1 text-base" onClick={() => setStep(step - 1)}><ArrowLeft /> Back</Button>}
        <Button className="h-14 flex-[2] text-base" disabled={!canNext || busy} onClick={() => (step < 3 ? setStep(step + 1) : submit())}>
          {busy && <Loader2 className="animate-spin" />}{step < 3 ? "Continue" : "Send my request"}{step < 3 && <ArrowRight />}
        </Button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) { return <main className="mx-auto max-w-xl px-4 pb-16 pt-8">{children}</main>; }
function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1><div className="mt-6 grid gap-3">{children}</div></section>;
}
