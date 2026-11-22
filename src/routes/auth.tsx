import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff sign in — CivicReach" },
      { name: "description", content: "Sign in to the CivicReach outreach and dispatch console." },
      { property: "og:title", content: "Staff sign in — CivicReach" },
      { property: "og:description", content: "Outreach worker and supervisor access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/console" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
        setMode("in");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 pb-16 pt-10">
      <h1 className="text-3xl font-bold tracking-tight">{mode === "in" ? "Staff sign in" : "Create staff account"}</h1>
      <p className="mt-2 text-muted-foreground">For outreach workers and diversion supervisors. Or use the demo view bar above to preview instantly.</p>
      <form onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        {mode === "up" && (
          <div className="grid gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" className="h-12" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" className="h-12" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" minLength={8} className="h-12" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button className="h-12 text-base" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} {mode === "in" ? "Sign in" : "Create account"}
        </Button>
        <button type="button" className="min-h-10 text-sm font-medium text-teal" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "New staff member? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}
