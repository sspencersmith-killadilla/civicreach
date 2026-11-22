import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BARRIERS, LIVING_SITUATIONS, makeTrackingCode, money } from "@/lib/civic";
import { ChoiceButton, TrackingCode } from "@/components/civic/ui";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Get help staying housed — CivicReach" },
      { name: "description", content: "A 4-step rapid diversion request for car repair, utilities, rent, travel, or ID. No login needed." },
      { property: "og:title", content: "Get help staying housed — CivicReach" },
      { property: "og:description", content: "Request rapid, flexible help to keep or regain housing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HelpWizard,
});

const CONTACTS = [
  { id: "phone", label: "Phone call or text", placeholder: "(555) 123-4567" },
  { id: "email", label: "Email", placeholder: "you@example.com" },
  { id: "hub", label: "Meet me at a local library or hub", placeholder: "e.g. Central Library, weekdays after 2pm" },
] as const;

function HelpWizard() {
  const [step, setStep] = useState(0);
  const [living, setLiving] = useState("");
  const [barrier, setBarrier] = useState("");
  const [amount, setAmount] = useState(250);
  const [method, setMethod] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  const canNext = [living, barrier, amount >= 50, method && contact.trim().length > 2][step];

  async function submit() {
    setBusy(true);
    const tracking = makeTrackingCode("D");
    const { error } = await supabase.from("diversion_requests").insert({
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

  if (code)
    return (
      <Shell>
        <h1 className="text-3xl font-bold tracking-tight">Request received</h1>
        <p className="mt-2 text-muted-foreground">A housing navigator will reach out using the contact method you chose, usually within one business day.</p>
        <div className="mt-6"><TrackingCode code={code} /></div>
        <Link to="/" className="mt-6 flex min-h-12 items-center justify-center rounded-xl border border-border font-semibold hover:bg-muted">Back to home</Link>
      </Shell>
    );

  return (
    <Shell>
      <div className="flex items-center gap-2" aria-label={`Step ${step + 1} of 4`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-2 flex-1 rounded-full ${i <= step ? "bg-teal" : "bg-muted"}`} />
        ))}
      </div>
      <p className="mt-4 text-sm font-semibold text-muted-foreground">Step {step + 1} of 4</p>

      {step === 0 && (
        <Step title="Where are you staying right now?">
          {LIVING_SITUATIONS.map((o) => (
            <ChoiceButton key={o.id} selected={living === o.id} onClick={() => setLiving(o.id)}>{o.label}</ChoiceButton>
          ))}
        </Step>
      )}
      {step === 1 && (
        <Step title="What's the biggest thing in the way?">
          {BARRIERS.map((o) => (
            <ChoiceButton key={o.id} selected={barrier === o.id} onClick={() => setBarrier(o.id)}>{o.label}</ChoiceButton>
          ))}
        </Step>
      )}
      {step === 2 && (
        <Step title="About how much would solve it?">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-center text-5xl font-extrabold tracking-tight">{money(amount)}</div>
            <Slider className="mt-8" min={50} max={1000} step={10} value={[amount]} onValueChange={(v) => setAmount(v[0] ?? 50)} aria-label="Amount needed" />
            <div className="mt-3 flex justify-between text-sm text-muted-foreground"><span>$50</span><span>$1,000</span></div>
          </div>
          <p className="text-sm text-muted-foreground">A best guess is fine — your navigator will confirm the details.</p>
        </Step>
      )}
      {step === 3 && (
        <Step title="How can we safely reach you?">
          {CONTACTS.map((o) => (
            <ChoiceButton key={o.id} selected={method === o.id} onClick={() => setMethod(o.id)}>{o.label}</ChoiceButton>
          ))}
          {method && (
            <Input
              autoFocus
              className="h-14 text-base"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={CONTACTS.find((c) => c.id === method)?.placeholder}
              maxLength={200}
            />
          )}
        </Step>
      )}

      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <Button variant="outline" className="h-14 flex-1 text-base" onClick={() => setStep(step - 1)}>
            <ArrowLeft /> Back
          </Button>
        )}
        <Button
          className="h-14 flex-[2] text-base"
          disabled={!canNext || busy}
          onClick={() => (step < 3 ? setStep(step + 1) : submit())}
        >
          {busy ? <Loader2 className="animate-spin" /> : null}
          {step < 3 ? "Continue" : "Send my request"} {step < 3 && <ArrowRight />}
        </Button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-xl px-4 pb-16 pt-8">{children}</main>;
}
function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <div className="mt-6 grid gap-3">{children}</div>
    </section>
  );
}
