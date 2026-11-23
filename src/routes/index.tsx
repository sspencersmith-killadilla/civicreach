import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Building2, CheckCircle2, HeartHandshake, MapPinned, ShieldCheck, Smartphone } from "lucide-react";

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

const responseSteps = [
  { icon: Smartphone, step: "01", title: "A resident asks for help", body: "A two-minute housing request or a mapped wellness check. No account required." },
  { icon: MapPinned, step: "02", title: "The right team responds", body: "Urgency and distance shape the civilian outreach queue. Field notes save offline." },
  { icon: HeartHandshake, step: "03", title: "A practical barrier gets solved", body: "Flexible grants follow approval limits, with every dollar deducted from the city fund." },
];

const workspaceFeatures = [
  { icon: Building2, title: "Your own city workspace", body: "Separate records, staff, fund, and resident links for every city." },
  { icon: ShieldCheck, title: "Access by invitation", body: "Supervisors control staff access. Permissions are enforced for every city." },
  { icon: CheckCircle2, title: "Ready for the field", body: "Mobile-first workflows and offline encounter sync keep casework moving." },
];

function Index() {
  return <main>
    <section className="border-b border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 sm:py-20 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
        <div>
          <span className="inline-flex rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-secondary-foreground">Housing help · civilian outreach · field casework</span>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[1.04] tracking-tight text-primary sm:text-6xl">Housing help and outreach, <span className="text-gradient-brand">in step.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">CivicReach gives residents one simple place to ask for help and gives city teams one live queue to respond, fund solutions, and document care — even with no signal.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/city-signup" className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-primary px-7 font-semibold text-primary-foreground transition-opacity hover:opacity-90">Set up your city <ArrowRight className="size-5" /></Link>
            <Link to="/c/$citySlug" params={{ citySlug: "demo" }} className="flex min-h-14 items-center justify-center rounded-full border border-border bg-card px-7 font-semibold transition-colors hover:bg-secondary">Explore Demo City</Link>
          </div>
          <Link to="/for-cities" className="mt-5 inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-teal hover:text-primary">See how CivicReach works for cities <ArrowRight className="size-4" /></Link>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5 shadow-card sm:p-7">
          <div className="flex items-center justify-between border-b border-border pb-4"><div><p className="text-sm font-semibold text-teal">Demo City</p><h2 className="mt-1 font-display text-xl font-bold">One connected response</h2></div><span className="rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-accent-foreground">Live queue</span></div>
          <ol className="mt-5 grid gap-5">
            {responseSteps.map((item) => <li key={item.step} className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-brand text-primary-foreground"><item.icon className="size-5" /></span><div><div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{item.step}</span><h3 className="font-display font-semibold">{item.title}</h3></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p></div></li>)}
          </ol>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-5 py-14">
      <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">One city, one connected workspace</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-primary">Built for careful work in the field.</h2></div>
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {workspaceFeatures.map((item) => <article key={item.title} className="rounded-xl border border-border bg-card p-6 shadow-card"><span className="grid size-10 place-items-center rounded-lg bg-teal-soft"><item.icon className="size-5 text-teal" /></span><h3 className="mt-4 font-display text-lg font-bold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p></article>)}
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-5 pb-14">
      <Link to="/guide" className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-card transition-colors hover:border-teal sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4"><BookOpen className="mt-1 size-6 shrink-0 text-brand-green" /><div><h2 className="font-display text-xl font-bold">Launch with a clear city guide</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Staff training, go-live checks, and self-hosting instructions in one place.</p></div></div>
        <span className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground">Read the guide <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
      </Link>
    </section>
  </main>;
}
