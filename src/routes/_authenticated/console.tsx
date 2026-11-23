import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FileLock2, HandCoins, Loader2, NotebookPen, Radio, Settings, Users } from "lucide-react";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { DispatchQueue } from "@/components/civic/DispatchQueue";
import { EncounterLogger } from "@/components/civic/EncounterLogger";
import { GrantApprover } from "@/components/civic/GrantApprover";
import { DocumentVault } from "@/components/civic/DocumentVault";
import { TeamManager } from "@/components/civic/TeamManager";
import { CitySettingsPanel } from "@/components/civic/CitySettingsPanel";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/console")({
  head: () => ({ meta: [
    { title: "City outreach console — CivicReach" },
    { name: "description", content: "City-scoped dispatch, field encounters, micro-grants, documents, and staff management." },
    { property: "og:title", content: "City outreach console — CivicReach" },
    { property: "og:description", content: "Field outreach and diversion casework for authorized city staff." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Console,
});

const TABS = [
  { id: "dispatch", label: "Dispatch", icon: Radio },
  { id: "encounter", label: "Encounter", icon: NotebookPen },
  { id: "grants", label: "Grants", icon: HandCoins },
  { id: "vault", label: "Vault", icon: FileLock2 },
  { id: "team", label: "Team", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
] as const;
type Tab = (typeof TABS)[number]["id"];

function Console() {
  const { profile, ready } = useSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dispatch");
  if (!ready) return <main className="grid min-h-64 place-items-center"><Loader2 className="animate-spin text-muted-foreground" /></main>;
  if (!profile?.role || !profile.city_id) return <main className="mx-auto max-w-md px-4 py-12"><h1 className="text-2xl font-bold">No staff access</h1><p className="mt-3 leading-7 text-muted-foreground">This account has not been assigned to a city team. Ask a city supervisor for an invitation.</p><Button className="mt-6 h-12" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>Back to home</Button></main>;
  const tabs = TABS.filter((item) => (item.id !== "team" && item.id !== "settings") || profile.role === "supervisor");

  return <div className="mx-auto flex max-w-6xl gap-6 px-4 pb-28 pt-6 md:pb-10">
    <nav className="sticky top-32 hidden h-fit w-56 shrink-0 md:block" aria-label="Console">
      <div className="mb-4 rounded-xl bg-card p-4 shadow-card"><div className="text-xs font-semibold uppercase tracking-wider text-teal">{profile.city?.name ?? "City workspace"}</div><div className="mt-2 font-semibold">{profile.full_name ?? "Staff"}</div><div className="text-sm capitalize text-muted-foreground">{profile.role} · {profile.team_zone}</div></div>
      {tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={cn("mb-1 flex min-h-12 w-full items-center gap-3 rounded-xl px-4 font-medium", tab === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted")}><item.icon className="size-5" /> {item.label}</button>)}
    </nav>
    <main className="min-w-0 flex-1">{tab === "dispatch" && <DispatchQueue />}{tab === "encounter" && <EncounterLogger />}{tab === "grants" && <GrantApprover />}{tab === "vault" && <DocumentVault />}{tab === "team" && profile.role === "supervisor" && <TeamManager />}{tab === "settings" && profile.role === "supervisor" && <CitySettingsPanel />}</main>
    <nav className={cn("fixed inset-x-0 bottom-0 z-40 grid border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden", tabs.length === 6 ? "grid-cols-6" : "grid-cols-4")} aria-label="Console">
      {tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold", tab === item.id ? "text-teal" : "text-muted-foreground")}><item.icon className="size-5" /> {item.label}</button>)}
    </nav>
  </div>;
}
