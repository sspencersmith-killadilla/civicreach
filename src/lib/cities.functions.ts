import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { citySlug, type CitySummary } from "./cities";

function browserActionLink(actionLink: string): string {
  const publicUrl = process.env["VITE_SUPABASE_URL"];
  if (!publicUrl) return actionLink;
  const action = new URL(actionLink);
  const publicBase = new URL(publicUrl);
  action.protocol = publicBase.protocol;
  action.host = publicBase.host;
  return action.toString();
}

function createPublicServerClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("The city directory is not configured.");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined);
        if (init?.headers) new Headers(init.headers).forEach((value, name) => headers.set(name, value));
        if ((key.startsWith("sb_publishable_") || key.startsWith("sb_secret_")) && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const getCityBySlug = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string().min(3).max(48).regex(/^[a-z0-9-]+$/) }).parse(data))
  .handler(async ({ data }): Promise<CitySummary | null> => {
    const supabase = createPublicServerClient();
    const { data: city, error } = await supabase
      .from("cities")
      .select("id,name,slug,region")
      .eq("slug", data.slug)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw new Error("The city directory is temporarily unavailable.");
    return city;
  });

const citySignupSchema = z.object({
  cityName: z.string().trim().min(3).max(120),
  region: z.string().trim().min(2).max(120),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(72),
  fundTotal: z.number().min(0).max(10_000_000),
});

export const createCityWorkspace = createServerFn({ method: "POST" })
  .inputValidator((data) => citySignupSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let userId: string | null = null;
    try {
      const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: false,
        user_metadata: { full_name: data.fullName },
      });
      if (authError) {
        if (/already|exists/i.test(authError.message)) throw new Error("An account already exists for this email. Sign in or use another work email.");
        throw new Error("We couldn't create the supervisor account. Check the email and password, then try again.");
      }
      userId = created.user.id;
      let confirmationLink: string | null = null;
      if (!created.user.email_confirmed_at) {
        const origin = new URL(getRequest().url).origin;
        const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: "signup",
          email: data.email,
          password: data.password,
          options: { redirectTo: `${origin}/auth` },
        });
        if (linkError) throw new Error("We couldn't create the account confirmation link. Please try again.");
        confirmationLink = browserActionLink(link.properties.action_link);
      }
      const slug = citySlug(data.cityName);
      if (slug.length < 3) throw new Error("Use a city name with at least three letters or numbers.");
      const { data: city, error } = await supabaseAdmin.rpc("provision_city", {
        _name: data.cityName,
        _region: data.region,
        _slug: slug,
        _user_id: userId,
        _full_name: data.fullName,
        _fund_total: data.fundTotal,
      });
      if (error || !city) throw new Error("We couldn't finish the city workspace. Please try again.");
      return {
        city: { id: city.id, name: city.name, slug: city.slug, region: city.region } satisfies CitySummary,
        confirmationRequired: !created.user.email_confirmed_at,
        confirmationLink,
      };
    } catch (error) {
      if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
      throw error instanceof Error ? error : new Error("City setup failed. Please try again.");
    }
  });

export const listCityTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: me, error: meError } = await context.supabase
      .from("profiles")
      .select("city_id")
      .eq("id", context.userId)
      .single();
    if (meError || !me?.city_id) throw new Error("No city workspace is assigned to this account.");
    const [{ data: profiles, error: profileError }, { data: roles, error: roleError }] = await Promise.all([
      context.supabase.from("profiles").select("id,full_name,team_zone").eq("city_id", me.city_id),
      context.supabase.from("user_roles").select("user_id,role").eq("city_id", me.city_id),
    ]);
    if (profileError || roleError) throw new Error("The team list is temporarily unavailable.");
    return (profiles ?? [])
      .map((profile) => ({
        id: profile.id,
        fullName: profile.full_name ?? "Staff member",
        teamZone: profile.team_zone ?? "Unassigned",
        role: roles?.find((row) => row.user_id === profile.id)?.role ?? null,
      }))
      .filter((member) => member.role !== null)
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  });

const inviteSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  role: z.enum(["outreach", "supervisor"]),
  teamZone: z.string().trim().min(2).max(80),
});

export const inviteStaffMember = createServerFn({ method: "POST" })
  .inputValidator((data) => inviteSchema.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("city_id")
      .eq("id", context.userId)
      .single();
    if (profileError || !profile?.city_id) throw new Error("No city workspace is assigned to this account.");
    const cityId = profile.city_id;
    const { data: supervisorRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("city_id", cityId)
      .eq("role", "supervisor")
      .maybeSingle();
    if (!supervisorRole) throw new Error("Only a city supervisor can invite staff.");

    const request = getRequest();
    const origin = new URL(request.url).origin;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invite, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email: data.email,
      options: { redirectTo: `${origin}/auth?invite=1`, data: { full_name: data.fullName } },
    });
    if (error) throw new Error(/already|exists/i.test(error.message) ? "That email already has an account." : "We couldn't create an invitation for that email.");

    const userId = invite.user.id;
    const [{ error: upsertProfileError }, { error: roleError }] = await Promise.all([
      supabaseAdmin.from("profiles").upsert({ id: userId, full_name: data.fullName, team_zone: data.teamZone, city_id: profile.city_id }),
      supabaseAdmin.from("user_roles").upsert({ user_id: userId, city_id: profile.city_id, role: data.role }, { onConflict: "user_id,city_id" }),
    ]);
    if (upsertProfileError || roleError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error("We couldn't finish the invitation. Please try again.");
    }
    return { email: data.email, inviteLink: browserActionLink(invite.properties.action_link) };
  });
