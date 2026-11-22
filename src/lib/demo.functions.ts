import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Shared demo accounts so reviewers can preview staff workflows instantly.
const DEMO = {
  outreach: { email: "outreach.demo@civicreach.app", name: "Jordan Alvarez", zone: "Downtown" },
  supervisor: { email: "supervisor.demo@civicreach.app", name: "Dr. Renee Okafor", zone: "Citywide" },
} as const;
export const DEMO_PASSWORD = "CivicReach-Demo-2026!";

export const ensureDemoAccount = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ role: z.enum(["outreach", "supervisor"]) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const acct = DEMO[data.role];
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = list?.users.find((u) => u.email === acct.email);
    if (!user) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: acct.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: acct.name },
      });
      if (error) throw new Error(error.message);
      user = created.user;
    }
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: user.id, full_name: acct.name, role: data.role, team_zone: acct.zone });
    return { email: acct.email };
  });
