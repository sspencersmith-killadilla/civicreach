import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  validateSearch: (search): { invite?: true } => (search["invite"] === "1" || search["invite"] === true ? { invite: true } : {}),
  head: () => ({ meta: [
    { title: "City staff sign in — CivicReach" },
    { name: "description", content: "Sign in to your invited CivicReach city outreach and dispatch console." },
    { property: "og:title", content: "City staff sign in — CivicReach" },
    { property: "og:description", content: "Invitation-only access for city outreach workers and supervisors." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { invite } = Route.useSearch();
  const { session, profile, refresh } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(event: React.FormEvent) {
    event.preventDefault(); setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await refresh(); navigate({ to: "/console" });
    } catch { toast.error("We couldn't sign you in. Check your email and password."); }
    finally { setBusy(false); }
  }

  async function completeInvite(event: React.FormEvent) {
    event.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error("Couldn't set your password. Use at least 12 characters and try again."); return; }
    await refresh(); toast.success("Your account is ready"); navigate({ to: "/console" });
  }

  if (invite && session) return <main className="mx-auto max-w-md px-4 pb-16 pt-10">
    <h1 className="text-3xl font-bold tracking-tight">Welcome to {profile?.city?.name ?? "your city team"}</h1><p className="mt-2 text-muted-foreground">Set your password to finish activating your staff account.</p>
    <form onSubmit={completeInvite} className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card"><div className="grid gap-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={72} className="h-12" value={password} onChange={(e) => setPassword(e.target.value)} required /></div><Button className="h-12" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Activate staff account</Button></form>
  </main>;

  if (session) return <main className="mx-auto max-w-md px-4 py-12"><h1 className="text-3xl font-bold">You’re signed in</h1><p className="mt-3 text-muted-foreground">Continue to {profile?.city?.name ?? "your city"}’s staff console.</p><Link to="/console" className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground">Open console</Link></main>;

  return <main className="mx-auto max-w-md px-4 pb-16 pt-10">
    <h1 className="text-3xl font-bold tracking-tight">City staff sign in</h1><p className="mt-2 text-muted-foreground">For invited outreach workers and diversion supervisors. Staff accounts are created by your city supervisor.</p>
    <form onSubmit={signIn} className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="grid gap-2"><Label htmlFor="email">Work email</Label><Input id="email" type="email" autoComplete="email" className="h-12" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <div className="grid gap-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="current-password" minLength={8} className="h-12" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
      <Button className="h-12 text-base" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Sign in</Button>
    </form>
    <div className="mt-6 rounded-xl border border-border p-4 text-sm text-muted-foreground">Setting up a municipality? <Link to="/city-signup" className="font-semibold text-teal">Create a city workspace</Link>. Need help? <Link to="/guide" className="font-semibold text-teal">Read the guide</Link>.</div>
  </main>;
}
