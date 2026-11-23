import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Wifi, WifiOff, ShieldCheck, Users, UserRound, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ensureDemoAccount, DEMO_PASSWORD } from "@/lib/demo.functions";
import { useOnline, useSession } from "@/lib/session";
import { DEMO_CITY } from "@/lib/cities";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/BrandMark";

type DemoRole = "public" | "outreach" | "supervisor";

export function AppHeader() {
  const online = useOnline();
  const { session, profile } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [busy, setBusy] = useState<DemoRole | null>(null);
  const current: DemoRole = session ? (profile?.role ?? "public") : "public";
  const showDemo = pathname === "/" || pathname.startsWith("/c/demo") || profile?.city_id === DEMO_CITY.id;

  async function switchTo(role: DemoRole) {
    setBusy(role);
    try {
      if (role === "public") {
        await supabase.auth.signOut();
        navigate({ to: "/", replace: true }); return;
      }
      const { email } = await ensureDemoAccount({ data: { role } });
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
      if (error) throw error;
      navigate({ to: "/console" });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't switch role"); }
    finally { setBusy(null); }
  }

  const roles: { id: DemoRole; label: string; icon: typeof Users }[] = [
    { id: "public", label: "Public Resident", icon: UserRound },
    { id: "outreach", label: "Outreach Worker", icon: Users },
    { id: "supervisor", label: "Diversion Supervisor", icon: ShieldCheck },
  ];

  return <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
    {showDemo && <div className="bg-primary text-primary-foreground"><div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-3 py-2 text-xs">
      <span className="shrink-0 font-semibold uppercase tracking-wider opacity-80">Demo City only</span>
      {roles.map((role) => <button key={role.id} onClick={() => switchTo(role.id)} disabled={busy !== null} className={cn("flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 font-medium transition-colors", current === role.id ? "bg-primary-foreground text-primary" : "hover:bg-primary-foreground/15")}>
        {busy === role.id ? <Loader2 className="size-3.5 animate-spin" /> : <role.icon className="size-3.5" />}{role.label}
      </button>)}
    </div></div>}
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
      <Link to="/" className="flex items-center gap-2.5"><BrandMark className="size-10 text-primary" /><span className="leading-tight"><span className="block text-xl font-extrabold tracking-tight">CivicReach</span><span className="hidden text-xs text-muted-foreground sm:block">A Civic Plexus app</span></span></Link>
      <div className="flex items-center gap-1.5">
        <span role="status" className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold", online ? "bg-teal-soft text-accent-foreground" : "bg-amber-soft text-amber-foreground")}>{online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}<span className="hidden sm:inline">{online ? "Online" : "Offline"}</span></span>
        {!session && <><Link to="/for-cities" className="hidden min-h-10 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted md:flex">For cities</Link><Link to="/guide" className="hidden min-h-10 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted md:flex">Guide</Link></>}
        {session ? <><Link to="/console" className="hidden min-h-10 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted sm:flex">Console</Link><button onClick={() => switchTo("public")} aria-label="Sign out" className="grid size-12 place-items-center rounded-lg hover:bg-muted"><LogOut className="size-4" /></button></> : <Link to="/auth" className="flex min-h-12 items-center rounded-full border border-border px-5 text-sm font-medium hover:bg-muted">Staff sign in</Link>}
      </div>
    </div>
  </header>;
}
