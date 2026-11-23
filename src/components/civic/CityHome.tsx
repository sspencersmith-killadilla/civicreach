import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, HeartHandshake, Home, MapPin, Phone, Search, ShieldCheck } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/civic/LanguageToggle";
import type { CitySummary } from "@/lib/cities";
import { usePublicCityConfig } from "@/lib/use-city-settings";
import { isOpenNow } from "@/lib/city-settings";

export function CityHome({ city }: { city: CitySummary }) {
  const { settings: s, goLive } = usePublicCityConfig(city.slug);
  const open = isOpenNow(s);
  const { lang, setLang, t } = useLang(s.languages.spanish);
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:pt-14">
      {!goLive && city.slug !== "demo" && <p className="mb-6 rounded-xl bg-amber-soft p-3 text-sm font-medium text-amber-foreground">{city.name} is piloting this service. Requests may not be monitored yet.</p>}
      {!open && <p className="mb-6 rounded-xl border border-border bg-card p-3 text-sm">{s.hours.afterHoursMessage}</p>}
      {s.languages.spanish && <div className="mb-4 flex justify-end"><LanguageToggle lang={lang} setLang={setLang} /></div>}
      <section className="max-w-2xl">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-teal"><MapPin className="size-4" /> {city.name} · {city.region}</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{t("How can we help today?")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {lang === "es" ? t("No account needed. Your information goes only to trained navigators and civilian outreach teams — never to police.") : `No account needed. Your information goes only to trained ${city.name} navigators and civilian outreach teams — never to police.`}
        </p>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-2">
        <PathCard city={city} to="help" icon={<Home className="size-7" />} tone="primary" title={t("I need help staying housed")}
          body={t("Car repair, utility shutoff, back rent, a bus ticket to family, or replacing lost ID. Takes about 2 minutes.")} cta={t("Start rapid help request")} />
        <PathCard city={city} to="wellness" icon={<HeartHandshake className="size-7" />} tone="teal" title={t("Request a compassionate wellness check")}
          body={t("Worried about someone outside? Send a civilian outreach team with water, supplies, and care — not a squad car.")} cta={t("Request outreach")} />
      </section>

      <Link to="/c/$citySlug/status" params={{ citySlug: city.slug }} className="mt-5 flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card px-5 font-semibold hover:bg-muted"><Search className="size-5 text-teal" />{t("Check a request")}<span className="hidden text-sm font-normal text-muted-foreground sm:inline">— {t("Have a tracking code? See where your request stands.")}</span></Link>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Clock, t: t("Fast response"), d: t("Wellness requests go directly to the city’s live outreach queue.") },
          { icon: ShieldCheck, t: t("Private to this city"), d: t("Your details are seen only by this city’s authorized outreach staff.") },
          { icon: Phone, t: t("In crisis right now?"), d: `${t("For immediate danger call")} ${s.emergency.emergencyNumber}. ${t("For crisis support call or text")} ${s.emergency.crisisLine}.` },
        ].map((item) => (
          <div key={item.t} className="rounded-xl border border-border bg-card p-5">
            <item.icon className="size-5 text-teal" />
            <div className="mt-3 font-semibold">{item.t}</div>
            <div className="mt-1 text-sm text-muted-foreground">{item.d}</div>
          </div>
        ))}
      </section>
      {city.slug === "demo" && <p className="mt-8 text-center text-sm text-muted-foreground">This is a sample workspace. Requests here are for demonstration, not a live city service.</p>}
      <p className="mt-6 text-center text-xs text-muted-foreground">{s.emergency.disclaimer}{s.profile.contactPhone || s.profile.contactEmail ? ` Questions: ${[s.profile.contactPhone, s.profile.contactEmail].filter(Boolean).join(" · ")}` : ""}</p>
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
