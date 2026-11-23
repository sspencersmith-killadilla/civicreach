import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, CloudOff, ExternalLink, FileLock2, Server, ShieldCheck, UserPlus } from "lucide-react";

export const Route = createFileRoute("/guide")({
  head: () => ({ meta: [
    { title: "City operations & self-hosting guide — CivicReach" },
    { name: "description", content: "Resident, supervisor, field staff, launch, and self-hosting instructions for a CivicReach city workspace." },
    { property: "og:title", content: "CivicReach city operations guide" },
    { property: "og:description", content: "Practical instructions for launching, operating, or self-hosting a city workspace." },
    { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Guide,
});

const sections = [
  { id: "resident", label: "Resident requests" },
  { id: "supervisor", label: "City setup & team" },
  { id: "field", label: "Field operations" },
  { id: "launch", label: "Go-live checklist" },
  { id: "self-host", label: "Self-hosting" },
];

function Guide() {
  return <main className="mx-auto max-w-6xl px-4 py-10"><div className="grid gap-10 lg:grid-cols-[220px_1fr]">
    <aside className="h-fit lg:sticky lg:top-24"><div className="flex items-center gap-2 font-bold"><BookOpen className="size-5 text-teal" /> City guide</div><nav className="mt-4 grid gap-1" aria-label="Guide sections">{sections.map((section) => <a key={section.id} href={`#${section.id}`} className="flex min-h-12 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted">{section.label}</a>)}</nav></aside>
    <div className="min-w-0"><p className="text-sm font-bold uppercase tracking-[0.2em] text-teal">Operations handbook</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight">Run a careful, connected city pilot.</h1><p className="mt-4 text-lg leading-8 text-muted-foreground">Use this guide to train your first team, validate your local procedures, and choose hosted or self-hosted operation.</p>
      <GuideSection id="resident" title="For residents">
        <ol className="grid gap-3"><li>Open your city’s unique CivicReach link. No account is required.</li><li>Choose housing help or a civilian wellness check and complete the short form.</li><li>Save the six-character tracking code. Staff use it to find the request.</li></ol>
        <Callout>Wellness checks go to civilian outreach, not police. For immediate danger call 911; for crisis support call or text 988. The response countdown is a target, not a guarantee.</Callout>
      </GuideSection>
      <GuideSection id="supervisor" title="For city supervisors">
        <h3 className="flex items-center gap-2 font-bold"><UserPlus className="size-5 text-teal" /> Set up and invite staff</h3><ol className="mt-3 grid gap-3"><li>Create the city workspace and confirm the supervisor email.</li><li>Sign in, open <strong>Console → Team</strong>, and create an invitation for each worker or supervisor.</li><li>Send each invitation privately. The recipient opens it, sets a password of at least 12 characters, and signs in.</li><li>Share the resident link only after completing the go-live checks below.</li></ol>
        <h3 className="mt-6 flex items-center gap-2 font-bold"><ShieldCheck className="size-5 text-teal" /> Fund controls</h3><p className="mt-2">Outreach grants up to $250 approve immediately. Amounts from $251–$1,000 require a supervisor. Every approved amount is deducted from that city’s own fund.</p>
      </GuideSection>
      <GuideSection id="field" title="For outreach workers">
        <div className="grid gap-4 sm:grid-cols-2"><article className="rounded-xl border border-border p-5"><CloudOff className="size-5 text-teal" /><h3 className="mt-3 font-bold">Without signal</h3><p className="mt-2">Open the console while online first. Log an encounter as usual; it is saved on the device and marked Queued for Sync. When signal returns, use Sync Now.</p></article><article className="rounded-xl border border-border p-5"><FileLock2 className="size-5 text-teal" /><h3 className="mt-3 font-bold">Client documents</h3><p className="mt-2">Confirm informed consent before upload. Use an alias rather than a full name. Viewing links expire after 60 seconds.</p></article></div>
        <Callout>Offline entries remain on that browser until synced. Use a city-managed device, lock it when unattended, and do not use another worker’s account. Full page loading still requires a previously loaded page; this release does not cache every page for a cold offline start.</Callout>
      </GuideSection>
      <GuideSection id="launch" title="Before public launch">
        <ul className="grid gap-3">{["Confirm who owns dispatch coverage and after-hours escalation.", "Replace sample service hubs with your city’s real destinations and procedures.", "Test every resident form and staff role on city-managed phones.", "Set local privacy, retention, consent, accessibility, and public-records procedures.", "Connect real transport and notification providers; ride records alone do not contact a provider.", "Publish clear response targets and emergency instructions on your city website."].map((text) => <li key={text} className="flex gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-teal" /><span>{text}</span></li>)}</ul>
      </GuideSection>
      <GuideSection id="self-host" title="Self-hosting">
        <p>CivicReach is a TanStack Start/React application with a Postgres-backed auth and data service. The repository includes the schema changes and environment variable names needed to run your own copy.</p>
        <h3 className="mt-5 flex items-center gap-2 font-bold"><Server className="size-5 text-teal" /> Deployment outline</h3>
        <ol className="mt-3 grid gap-3"><li>Create a managed or self-hosted Supabase-compatible project with Auth, Postgres, Storage, and Realtime.</li><li>Apply every file in <code>drizzle/migrations/</code> in filename order. Create private <code>client-documents</code> and public-upload <code>wellness-photos</code> buckets before using uploads.</li><li>Set the browser and server environment variables listed in <code>docs/SELF_HOSTING.md</code>. Keep the service key server-only.</li><li>Run <code>bun install</code> and <code>bun run build</code>. Deploy the generated TanStack Start output to a compatible Node or edge host.</li><li>Configure email confirmation, invite redirect URLs, backups, monitoring, retention, and your public city URL.</li></ol>
        <Callout>Do not expose the service key in browser variables, disable row-level security, or copy production client records into a demo workspace. Review the full repository guide before deployment.</Callout>
        <a href="https://supabase.com/docs/guides/self-hosting" target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-12 items-center gap-2 font-semibold text-teal">Supabase self-hosting reference <ExternalLink className="size-4" /></a>
      </GuideSection>
      <div className="mt-10 flex flex-col gap-3 rounded-2xl bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold">Ready to validate a workspace?</h2><p className="mt-1 text-sm opacity-80">Start hosted, or use Demo City for a no-setup walkthrough.</p></div><Link to="/city-signup" className="flex min-h-12 items-center justify-center rounded-xl bg-primary-foreground px-5 font-semibold text-primary">Create city workspace</Link></div>
    </div>
  </div></main>;
}

function GuideSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) { return <section id={id} className="scroll-mt-28 border-t border-border py-10 first:mt-8"><h2 className="mb-5 text-2xl font-bold tracking-tight">{title}</h2><div className="leading-7 text-muted-foreground">{children}</div></section>; }
function Callout({ children }: { children: React.ReactNode }) { return <p className="mt-5 rounded-xl bg-amber-soft p-4 text-sm leading-6 text-amber-foreground">{children}</p>; }
