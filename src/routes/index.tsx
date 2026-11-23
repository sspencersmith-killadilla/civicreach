import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, CheckCircle2, HeartHandshake, MapPinned, ShieldCheck, Smartphone } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "CivicReach — Housing help and outreach, in step with your city" },
    { name: "description", content: "A city-ready workspace for rapid housing diversion, compassionate 311 outreach, and offline field casework." },
    { property: "og:title", content: "CivicReach — Every response, in step" },
    { property: "og:description", content: "One connected path from a resident’s request to outreach, flexible funding, and follow-up." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

function Index() {
  return <main>
    <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-12 sm:pt-20 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
      <div>
        <div className="flex items-center gap-3 text-teal"><BrandMark className="size-12" /><span className="text-sm font-bold uppercase tracking-[0.22em]">Public service, connected</span></div>
        <h1 className="mt-7 max-w-3xl text-5xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl">Housing help and outreach, <span className="text-gradient-brand">in step.</span></h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">CivicReach gives residents one simple place to ask for help and gives city teams one live queue to respond, fund solutions, and document care — even with no signal.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/city-signup" className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-primary px-7 font-semibold text-primary-foreground">Set up your city <ArrowRight className="size-5" /></Link>
          <Link to="/c/$citySlug" params={{ citySlug: "demo" }} className="flex min-h-14 items-center justify-center rounded-full border border-border bg-card px-7 font-semibold hover:bg-muted">Explore Demo City</Link>
        </div>
        <Link to="/for-cities" className="mt-5 inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-teal">See how CivicReach works for cities <ArrowRight className="size-4" /></Link>
      </div>
      <div className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7">
        <div className="flex items-center justify-between border-b border-border pb-4"><div><p className="text-sm font-semibold text-teal">Demo City</p><h2 className="mt-1 text-xl font-bold">One connected response</h2></div><span className="rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-accent-foreground">Live queue</span></div>
        <ol className="mt-5 grid gap-5">
          {[
            { icon: Smartphone, step: "01", title: "A resident asks for help", body: "A two-minute housing request or a mapped wellness check. No account required." },
            { icon: MapPinned, step: "02", title: "The right team responds", body: "Urgency and distance shape the civilian outreach queue. Field notes save offline." },
            { icon: HeartHandshake, step: "03", title: "A practical barrier gets solved", body: "Flexible grants follow approval limits, with every dollar deducted from the city fund." },
          ].map((item) => <li key={item.step} className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-teal"><item.icon className="size-5" /></span><div><div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{item.step}</span><h3 className="font-semibold">{item.title}</h3></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p></div></li>)}
        </ol>
      </div>
    </section>
    <section className="border-y border-border bg-card"><div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
      {[
        { icon: Building2, title: "Your own city workspace", body: "Separate records, staff, fund, and resident links for every city." },
        { icon: ShieldCheck, title: "Access by invitation", body: "Supervisors control staff access. Permissions are enforced for every city." },
        { icon: CheckCircle2, title: "Ready for the field", body: "Mobile-first workflows and offline encounter sync keep casework moving." },
      ].map((item) => <div key={item.title}><item.icon className="size-6 text-teal" /><h2 className="mt-3 font-bold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p></div>)}
    </div></section>
    <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">CivicReach · a Civic Plexus app</footer>
  </main>;
}
