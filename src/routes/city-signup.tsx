import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, CheckCircle2, Copy, Loader2 } from "lucide-react";
import { createCityWorkspace } from "@/lib/cities.functions";
import type { CitySummary } from "@/lib/cities";
import { money } from "@/lib/civic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/city-signup")({
  head: () => ({ meta: [
    { title: "Create your city workspace — CivicReach" },
    { name: "description", content: "Set up an isolated CivicReach workspace, supervisor account, diversion fund, and resident link for your city." },
    { property: "og:title", content: "Create your city workspace — CivicReach" },
    { property: "og:description", content: "Launch a separate, secure home for your city’s housing and outreach work." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: CitySignup,
});

function CitySignup() {
  const [cityName, setCityName] = useState("");
  const [region, setRegion] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fundTotal, setFundTotal] = useState("25000");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ city: CitySummary; confirmationRequired: boolean; confirmationLink: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const created = await createCityWorkspace({ data: { cityName, region, fullName, email: email.trim(), password, fundTotal: Number(fundTotal) } });
      setResult(created);
    } catch (err) { setError(err instanceof Error ? err.message : "City setup failed. Please try again."); }
    finally { setBusy(false); }
  }

  if (result) {
    const residentPath = `/c/${result.city.slug}`;
    return <main className="mx-auto max-w-2xl px-4 py-12">
      <CheckCircle2 className="size-12 text-teal" /><h1 className="mt-5 text-4xl font-extrabold tracking-tight">{result.city.name} is ready for setup.</h1>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">{result.confirmationRequired ? `Confirm ${email} before signing in.` : "Your supervisor account is ready."} Then invite your team and test the resident forms before sharing the link publicly.</p>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card"><div className="text-sm font-semibold text-muted-foreground">Your resident link</div><div className="mt-2 break-all font-mono text-lg font-semibold">{typeof window !== "undefined" ? window.location.origin : ""}{residentPath}</div>
        <Button variant="outline" className="mt-4 h-12" onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}${residentPath}`); setCopied(true); }}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy resident link"}</Button>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {result.confirmationLink ? <a href={result.confirmationLink} className="flex min-h-14 items-center justify-center rounded-full bg-primary px-5 font-semibold text-primary-foreground">Confirm email & continue <ArrowRight /></a> : <Link to="/auth" className="flex min-h-14 items-center justify-center rounded-full bg-primary px-5 font-semibold text-primary-foreground">Supervisor sign in <ArrowRight /></Link>}
        <Link to="/guide" className="flex min-h-14 items-center justify-center rounded-full border border-border bg-card px-5 font-semibold">Open launch guide</Link>
      </div>
    </main>;
  }

  return <main className="mx-auto max-w-5xl px-4 py-10"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
    <section><p className="text-sm font-bold uppercase tracking-[0.2em] text-teal">Hosted city signup</p><h1 className="mt-4 text-4xl font-extrabold tracking-tight">Create your city workspace</h1><p className="mt-4 leading-7 text-muted-foreground">One supervisor account, one separate fund, and one shareable resident link. No credit card or technical setup needed for this pilot workspace.</p>
      <ul className="mt-6 grid gap-3 text-sm">{["Separate records and staff permissions", `${money(Number(fundTotal) || 0)} starting diversion fund`, "A resident link you can share when ready"].map((text) => <li key={text} className="flex gap-2"><CheckCircle2 className="size-5 shrink-0 text-teal" />{text}</li>)}</ul>
      <p className="mt-6 text-sm leading-6 text-muted-foreground">Use an official work email. Start with a limited pilot before connecting live public services.</p>
    </section>
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
      <div className="grid gap-2"><Label htmlFor="city-name">City or municipality</Label><Input id="city-name" className="h-12" placeholder="City of Riverton" value={cityName} onChange={(e) => setCityName(e.target.value)} minLength={3} maxLength={120} required /></div>
      <div className="grid gap-2"><Label htmlFor="region">State, province, or region</Label><Input id="region" className="h-12" placeholder="State or region" value={region} onChange={(e) => setRegion(e.target.value)} minLength={2} maxLength={120} required /></div>
      <div className="grid gap-2"><Label htmlFor="admin-name">Your full name</Label><Input id="admin-name" autoComplete="name" className="h-12" value={fullName} onChange={(e) => setFullName(e.target.value)} minLength={2} maxLength={120} required /></div>
      <div className="grid gap-2"><Label htmlFor="admin-email">Work email</Label><Input id="admin-email" type="email" autoComplete="email" className="h-12" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <div className="grid gap-2"><Label htmlFor="admin-password">Password</Label><Input id="admin-password" type="password" autoComplete="new-password" className="h-12" value={password} onChange={(e) => setPassword(e.target.value)} minLength={12} maxLength={72} required /><p className="text-xs text-muted-foreground">At least 12 characters.</p></div>
      <div className="grid gap-2"><Label htmlFor="fund-total">Starting diversion fund (USD)</Label><Input id="fund-total" type="number" inputMode="decimal" min={0} max={10000000} step={100} className="h-12" value={fundTotal} onChange={(e) => setFundTotal(e.target.value)} required /></div>
      {error && <p role="alert" className="rounded-xl bg-amber-soft p-3 text-sm font-medium text-amber-foreground">{error}</p>}
      <Button className="mt-2 h-14 text-base" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : null}{busy ? "Creating workspace…" : "Create city workspace"}<ArrowRight /></Button>
      <p className="text-center text-xs leading-5 text-muted-foreground">By creating a workspace, you confirm you’re authorized to set up a pilot for this municipality.</p>
    </form>
  </div></main>;
}
