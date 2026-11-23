import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DEMO_CITY } from "./cities";

// Shared accounts are deliberately confined to Demo City and cannot read real city records.
const DEMO = {
  outreach: { email: "outreach.demo@civicreach.app", name: "Jordan Alvarez", zone: "Downtown" },
  supervisor: { email: "supervisor.demo@civicreach.app", name: "Dr. Renee Okafor", zone: "Citywide" },
} as const;
export const DEMO_PASSWORD = "CivicReach-Demo-2026!";

export const ensureDemoAccount = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ role: z.enum(["outreach", "supervisor"]) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const account = DEMO[data.role];
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = list?.users.find((candidate) => candidate.email === account.email);
    if (!user) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({ email: account.email, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { full_name: account.name } });
      if (error) throw new Error(error.message);
      user = created.user;
    }
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({ id: user.id, full_name: account.name, team_zone: account.zone, city_id: DEMO_CITY.id });
    const { error: roleError } = await supabaseAdmin.from("user_roles").upsert({ user_id: user.id, city_id: DEMO_CITY.id, role: data.role }, { onConflict: "user_id,city_id" });
    if (profileError || roleError) throw new Error("Demo access is temporarily unavailable.");
    return { email: account.email };
  });
