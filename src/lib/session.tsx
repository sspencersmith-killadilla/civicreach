import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { StaffRole } from "./civic";
import type { CitySummary } from "./cities";

export type Profile = { id: string; full_name: string | null; role: StaffRole | null; team_zone: string | null; city_id: string | null; city: CitySummary | null };
type Ctx = { session: Session | null; profile: Profile | null; ready: boolean; refresh: () => Promise<void> };
const SessionCtx = createContext<Ctx>({ session: null, profile: null, ready: false, refresh: async () => {} });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  async function loadProfile(current: Session | null) {
    if (!current) { setProfile(null); return; }
    const { data: base } = await supabase.from("profiles").select("id,full_name,team_zone,city_id").eq("id", current.user.id).maybeSingle();
    if (!base) { setProfile(null); return; }
    const [{ data: roleRow }, { data: city }] = await Promise.all([
      base.city_id
        ? supabase.from("user_roles").select("role").eq("user_id", current.user.id).eq("city_id", base.city_id).maybeSingle()
        : Promise.resolve({ data: null }),
      base.city_id ? supabase.from("cities").select("id,name,slug,region").eq("id", base.city_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    setProfile({ ...base, role: roleRow?.role ?? null, city });
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, current) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setSession(current);
      setTimeout(() => void loadProfile(current), 0);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return <SessionCtx.Provider value={{ session, profile, ready, refresh: () => loadProfile(session) }}>{children}</SessionCtx.Provider>;
}

export const useSession = () => useContext(SessionCtx);

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return online;
}
