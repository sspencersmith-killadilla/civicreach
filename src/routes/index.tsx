import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, HeartHandshake, ArrowRight, Clock, ShieldCheck, Phone } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CivicReach — Get help staying housed or request a wellness check" },
      { name: "description", content: "Rapid housing diversion help and civilian wellness checks. No login, no police — just neighbors helping neighbors." },
      { property: "og:title", content: "CivicReach — Help is a tap away" },
      { property: "og:description", content: "Get help staying housed or request a compassionate wellness check for someone outside." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:pt-14">
      <section className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal">City Housing & Outreach Services</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">How can we help today?</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          No account needed. Your information goes only to trained city navigators and civilian outreach teams — never to police.
        </p>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-2">
        <PathCard
          to="/help"
          icon={<Home className="size-7" />}
          tone="primary"
          title="I need help staying housed"
          body="Car repair, utility shutoff, back rent, a bus ticket to family, or replacing lost ID. Takes about 2 minutes."
          cta="Start rapid help request"
        />
        <PathCard
          to="/wellness"
          icon={<HeartHandshake className="size-7" />}
          tone="teal"
          title="Request a compassionate wellness check"
          body="Worried about someone outside? Send a civilian outreach team with water, supplies, and care — not a squad car."
          cta="Request outreach"
        />
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Clock, t: "Fast response", d: "Most wellness checks are reached within 45 minutes." },
          { icon: ShieldCheck, t: "Private & safe", d: "Your details are seen only by outreach staff." },
          { icon: Phone, t: "In crisis right now?", d: "Call or text 988 for immediate support, any time." },
        ].map((x) => (
          <div key={x.t} className="rounded-xl border border-border bg-card p-5">
            <x.icon className="size-5 text-teal" />
            <div className="mt-3 font-semibold">{x.t}</div>
            <div className="mt-1 text-sm text-muted-foreground">{x.d}</div>
          </div>
        ))}
      </section>
    </main>
  );
}

function PathCard({ to, icon, title, body, cta, tone }: { to: "/help" | "/wellness"; icon: React.ReactNode; title: string; body: string; cta: string; tone: "primary" | "teal" }) {
  const accent = tone === "primary" ? "bg-primary text-primary-foreground" : "bg-teal text-teal-foreground";
  return (
    <Link to={to} className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-transform hover:-translate-y-0.5 sm:p-8">
      <span className={`grid size-14 place-items-center rounded-2xl ${accent}`}>{icon}</span>
      <h2 className="mt-5 text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-2 flex-1 text-muted-foreground">{body}</p>
      <span className={`mt-6 flex min-h-14 items-center justify-between rounded-xl px-5 text-base font-semibold ${accent}`}>
        {cta}
        <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
