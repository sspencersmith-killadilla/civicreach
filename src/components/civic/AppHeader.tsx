import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Wifi, WifiOff, ShieldCheck, Users, UserRound, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ensureDemoAccount, DEMO_PASSWORD } from "@/lib/demo.functions";
import { useOnline, useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

type DemoRole = "public" | "outreach" | "supervisor";

export function AppHeader() {
  const online = useOnline();
  const { session, profile } = useSession();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<DemoRole | null>(null);
  const current: DemoRole = session ? (profile?.role ?? "outreach") : "public";

  async function switchTo(role: DemoRole) {
    setBusy(role);
    try {
      if (role === "public") {
        await supabase.auth.signOut();
        navigate({ to: "/", replace: true });
        return;
      }
      const { email } = await ensureDemoAccount({ data: { role } });
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
      if (error) throw error;
      navigate({ to: "/console" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't switch role");
    } finally {
      setBusy(null);
    }
  }

  const roles: { id: DemoRole; label: string; icon: typeof Users }[] = [
    { id: "public", label: "Public Resident", icon: UserRound },
    { id: "outreach", label: "Outreach Worker", icon: Users },
    { id: "supervisor", label: "Diversion Supervisor", icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-3 py-2 text-xs">
          <span className="shrink-0 font-semibold uppercase tracking-wider opacity-80">Demo view</span>
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => switchTo(r.id)}
              disabled={busy !== null}
              className={cn(
                "flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 font-medium transition-colors",
                current === r.id ? "bg-primary-foreground text-primary" : "hover:bg-primary-foreground/15",
              )}
            >
              {busy === r.id ? <Loader2 className="size-3.5 animate-spin" /> : <r.icon className="size-3.5" />}
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">CR</span>
          <span className="leading-tight">
            <span className="block text-lg font-bold tracking-tight">CivicReach</span>
            <span className="hidden text-xs text-muted-foreground sm:block">Housing diversion & compassionate outreach</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span
            role="status"
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
              online ? "bg-teal-soft text-accent-foreground" : "bg-amber-soft text-amber-foreground",
            )}
          >
            {online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
            {online ? "Online" : "Offline"}
          </span>
          {session ? (
            <>
              <Link to="/console" className="hidden min-h-10 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted sm:flex">
                Console
              </Link>
              <button onClick={() => switchTo("public")} aria-label="Sign out" className="grid size-10 place-items-center rounded-lg hover:bg-muted">
                <LogOut className="size-4" />
              </button>
            </>
          ) : (
            <Link to="/auth" className="flex min-h-10 items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted">
              Staff sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
