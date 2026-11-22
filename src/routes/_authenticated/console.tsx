import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileLock2, HandCoins, NotebookPen, Radio } from "lucide-react";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { DispatchQueue } from "@/components/civic/DispatchQueue";
import { EncounterLogger } from "@/components/civic/EncounterLogger";
import { GrantApprover } from "@/components/civic/GrantApprover";
import { DocumentVault } from "@/components/civic/DocumentVault";

export const Route = createFileRoute("/_authenticated/console")({
  head: () => ({
    meta: [
      { title: "Outreach console — CivicReach" },
      { name: "description", content: "Dispatch queue, field encounters, micro-grants and document vault for outreach staff." },
      { property: "og:title", content: "Outreach console — CivicReach" },
      { property: "og:description", content: "Field outreach and diversion casework console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Console,
});

const TABS = [
  { id: "dispatch", label: "Dispatch", icon: Radio },
  { id: "encounter", label: "Encounter", icon: NotebookPen },
  { id: "grants", label: "Grants", icon: HandCoins },
  { id: "vault", label: "Vault", icon: FileLock2 },
] as const;
type Tab = (typeof TABS)[number]["id"];

function Console() {
  const { profile } = useSession();
  const [tab, setTab] = useState<Tab>("dispatch");

  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 pb-28 pt-6 md:pb-10">
      <nav className="sticky top-32 hidden h-fit w-56 shrink-0 md:block" aria-label="Console">
        <div className="mb-4 rounded-xl bg-card p-4 shadow-card">
          <div className="font-semibold">{profile?.full_name ?? "Staff"}</div>
          <div className="text-sm capitalize text-muted-foreground">{profile?.role ?? "…"} · {profile?.team_zone}</div>
        </div>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("mb-1 flex min-h-12 w-full items-center gap-3 rounded-xl px-4 font-medium", tab === t.id ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
            <t.icon className="size-5" /> {t.label}
          </button>
        ))}
      </nav>
      <main className="min-w-0 flex-1">
        {tab === "dispatch" && <DispatchQueue />}
        {tab === "encounter" && <EncounterLogger />}
        {tab === "grants" && <GrantApprover />}
        {tab === "vault" && <DocumentVault />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Console">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold", tab === t.id ? "text-teal" : "text-muted-foreground")}>
            <t.icon className="size-5" /> {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
