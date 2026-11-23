import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, HeartHandshake, Home, MapPin, Phone, ShieldCheck } from "lucide-react";
import type { CitySummary } from "@/lib/cities";

export function CityHome({ city }: { city: CitySummary }) {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:pt-14">
      <section className="max-w-2xl">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-teal"><MapPin className="size-4" /> {city.name} · {city.region}</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">How can we help today?</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          No account needed. Your information goes only to trained {city.name} navigators and civilian outreach teams — never to police.
        </p>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-2">
        <PathCard city={city} to="help" icon={<Home className="size-7" />} tone="primary" title="I need help staying housed"
          body="Car repair, utility shutoff, back rent, a bus ticket to family, or replacing lost ID. Takes about 2 minutes." cta="Start rapid help request" />
        <PathCard city={city} to="wellness" icon={<HeartHandshake className="size-7" />} tone="teal" title="Request a compassionate wellness check"
          body="Worried about someone outside? Send a civilian outreach team with water, supplies, and care — not a squad car." cta="Request outreach" />
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Clock, t: "Fast response", d: "Wellness requests go directly to the city’s live outreach queue." },
          { icon: ShieldCheck, t: "Private to this city", d: "Your details are seen only by this city’s authorized outreach staff." },
          { icon: Phone, t: "In crisis right now?", d: "Call or text 988 for immediate support, any time." },
        ].map((item) => (
          <div key={item.t} className="rounded-xl border border-border bg-card p-5">
            <item.icon className="size-5 text-teal" />
            <div className="mt-3 font-semibold">{item.t}</div>
            <div className="mt-1 text-sm text-muted-foreground">{item.d}</div>
          </div>
        ))}
      </section>
      {city.slug === "demo" && <p className="mt-8 text-center text-sm text-muted-foreground">This is a sample workspace. Requests here are for demonstration, not a live city service.</p>}
    </main>
  );
}

function PathCard({ city, to, icon, title, body, cta, tone }: { city: CitySummary; to: "help" | "wellness"; icon: React.ReactNode; title: string; body: string; cta: string; tone: "primary" | "teal" }) {
  const accent = tone === "primary" ? "bg-primary text-primary-foreground" : "bg-teal text-teal-foreground";
  return (
    <Link to={to === "help" ? "/c/$citySlug/help" : "/c/$citySlug/wellness"} params={{ citySlug: city.slug }}
      className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-transform hover:-translate-y-0.5 sm:p-8">
      <span className={`grid size-14 place-items-center rounded-2xl ${accent}`}>{icon}</span>
      <h2 className="mt-5 text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-2 flex-1 text-muted-foreground">{body}</p>
      <span className={`mt-6 flex min-h-14 items-center justify-between rounded-xl px-5 text-base font-semibold ${accent}`}>
        {cta}<ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
