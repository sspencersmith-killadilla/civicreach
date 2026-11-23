import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCityBySlug } from "@/lib/cities.functions";
import { usePublicCityConfig } from "@/lib/use-city-settings";
import { useLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/civic/LanguageToggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/c/$citySlug/status")({
  loader: async ({ params }) => {
    const city = await getCityBySlug({ data: { slug: params.citySlug } });
    if (!city) throw notFound();
    return city;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "City";
    return { meta: [
      { title: `Check request status — ${name} | CivicReach` },
      { name: "description", content: `Look up a ${name} housing or wellness request with its tracking code.` },
      { property: "og:title", content: `Check your ${name} request` },
      { property: "og:description", content: "Enter your tracking code to see where your request stands." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  component: StatusPage,
});

type Result = { kind: "housing" | "wellness"; status: string; created_at: string };

function StatusPage() {
  const city = Route.useLoaderData();
  const { settings } = usePublicCityConfig(city.slug);
  const { lang, setLang, t } = useLang(settings.languages.spanish);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null | "missing">(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data } = await supabase.rpc("public_request_status", { _slug: city.slug, _code: code });
    setBusy(false);
    setResult(data ? (data as unknown as Result) : "missing");
  }

  return <main className="mx-auto max-w-xl px-4 pb-16 pt-8">
    <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-teal">{city.name}</p>{settings.languages.spanish && <LanguageToggle lang={lang} setLang={setLang} />}</div>
    <h1 className="mt-3 text-3xl font-bold tracking-tight">{t("Check request status")}</h1>
    <p className="mt-2 text-muted-foreground">{t("Have a tracking code? See where your request stands.")}</p>
    <form onSubmit={lookup} className="mt-6 flex gap-2">
      <Input aria-label={t("Tracking code")} placeholder={t("Tracking code")} className="h-14 font-mono text-lg uppercase tracking-widest" value={code} maxLength={12} onChange={(e) => setCode(e.target.value)} />
      <Button className="h-14 px-5" disabled={busy || code.trim().length < 4}>{busy ? <Loader2 className="animate-spin" /> : <Search />}{t("Check status")}</Button>
    </form>
    {result === "missing" && <p className="mt-6 rounded-xl bg-amber-soft p-4 text-sm font-medium text-amber-foreground">{t("We couldn't find that code. Check the letters and try again.")}</p>}
    {result && result !== "missing" && <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t(result.kind === "housing" ? "Housing help request" : "Wellness check")}</div>
      <div className="mt-2 text-2xl font-bold">{t(result.status)}</div>
      <div className="mt-1 text-sm text-muted-foreground">{t("Submitted")}: {new Date(result.created_at).toLocaleString(lang === "es" ? "es-US" : "en-US")}</div>
    </div>}
    <Link to="/c/$citySlug" params={{ citySlug: city.slug }} className="mt-8 flex min-h-12 items-center justify-center rounded-xl border border-border font-semibold hover:bg-muted">{t("Back")}</Link>
  </main>;
}
