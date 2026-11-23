import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Building2, CloudOff, FileLock2, HandCoins, Radio, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/for-cities")({
  head: () => ({ meta: [
    { title: "CivicReach for cities — Launch a connected outreach workspace" },
    { name: "description", content: "Create a separate city workspace for housing diversion, civilian outreach, field casework, flexible grants, and secure records." },
    { property: "og:title", content: "CivicReach for cities" },
    { property: "og:description", content: "A practical, city-ready path from resident request to field response." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ForCities,
});

function ForCities() {
  return <main>
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal">For municipal teams</p>
      <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">Start with one workspace. Bring your whole response into step.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Set up a dedicated workspace for your city, invite your team, and share one resident link. CivicReach keeps each city’s operational and client records separate.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link to="/city-signup" className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground">Create your city workspace <ArrowRight /></Link><Link to="/guide" className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 font-semibold"><BookOpen /> Read the city guide</Link></div>
    </section>
    <section className="bg-card"><div className="mx-auto grid max-w-6xl gap-5 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
      {[
        { icon: Radio, title: "Live civilian dispatch", body: "Wellness and diversion requests enter one queue, ordered by urgency and location." },
        { icon: CloudOff, title: "Offline field casework", body: "Encounters save on the device first and sync when signal returns, with city separation preserved." },
        { icon: HandCoins, title: "Controlled flexible funds", body: "Up to $250 can be approved by outreach; $251–$1,000 goes to a supervisor." },
        { icon: FileLock2, title: "Private document vault", body: "Consent-gated uploads, short-lived viewing links, and expiry warnings for client records." },
        { icon: ShieldCheck, title: "City-scoped access", body: "Staff see only their assigned city. Staff accounts are created by supervisor invitation." },
        { icon: Building2, title: "Hosted or self-hosted", body: "Use the hosted signup or deploy your own copy with the included operations guide." },
      ].map((item) => <article key={item.title} className="rounded-2xl border border-border bg-background p-6"><item.icon className="size-6 text-teal" /><h2 className="mt-4 text-lg font-bold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p></article>)}
    </div></section>
    <section className="mx-auto max-w-6xl px-4 py-12"><h2 className="text-2xl font-bold">A clear path to a careful pilot</h2><ol className="mt-6 grid gap-4 md:grid-cols-3">
      {["Create the workspace and confirm the supervisor email.", "Invite a small staff team and test resident submissions.", "Set local response targets, train staff, then publish your city link."].map((text, index) => <li key={text} className="rounded-xl border border-border p-5"><span className="font-mono text-sm text-teal">0{index + 1}</span><p className="mt-3 font-medium leading-6">{text}</p></li>)}
    </ol><p className="mt-6 rounded-xl bg-amber-soft p-4 text-sm leading-6 text-amber-foreground"><strong>Before a live launch:</strong> connect your city’s actual 311, transport, notification, retention, accessibility, and emergency escalation procedures. CivicReach does not replace emergency services or guarantee response times.</p></section>
  </main>;
}
