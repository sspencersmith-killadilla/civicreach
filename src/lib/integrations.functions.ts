import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { mergeSettings, type CitySettings } from "./city-settings";
import { alertText, shouldAlert, validEmails, validPhones } from "./notify";

type Secrets = { resend_api_key?: string; twilio_account_sid?: string; twilio_auth_token?: string };

async function loadCity(cityId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: city }, { data: cfg }, { data: sec }] = await Promise.all([
    supabaseAdmin.from("cities").select("name").eq("id", cityId).maybeSingle(),
    supabaseAdmin.from("city_settings").select("settings").eq("city_id", cityId).maybeSingle(),
    supabaseAdmin.from("city_integration_secrets").select("secrets").eq("city_id", cityId).maybeSingle(),
  ]);
  return { name: city?.name ?? "City", settings: mergeSettings(cfg?.settings), secrets: (sec?.secrets ?? {}) as Secrets };
}

async function sendEmail(s: CitySettings, sec: Secrets, to: string[], subject: string, text: string) {
  const e = s.integrations.email;
  if (e.provider !== "resend" || !sec.resend_api_key || !e.fromAddress || !to.length) return "not connected";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${sec.resend_api_key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: e.fromName ? `${e.fromName} <${e.fromAddress}>` : e.fromAddress, to, subject, text }),
  });
  return res.ok ? "sent" : `failed (${res.status}): ${(await res.text()).slice(0, 200)}`;
}

async function sendSms(s: CitySettings, sec: Secrets, to: string[], body: string) {
  const m = s.integrations.sms;
  if (m.provider !== "twilio" || !sec.twilio_account_sid || !sec.twilio_auth_token || !m.fromNumber || !to.length) return "not connected";
  const auth = btoa(`${sec.twilio_account_sid}:${sec.twilio_auth_token}`);
  const results = await Promise.all(to.map((To) => fetch(`https://api.twilio.com/2010-04-01/Accounts/${sec.twilio_account_sid}/Messages.json`, {
    method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To, From: m.fromNumber, Body: body }),
  })));
  const bad = results.find((r) => !r.ok);
  return bad ? `failed (${bad.status}): ${(await bad.text()).slice(0, 200)}` : "sent";
}

/** Public: called after a resident submits. Only alerts for a request that really exists and is brand new. */
export const notifyNewRequest = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ cityId: z.string().uuid(), kind: z.enum(["wellness", "housing"]), code: z.string().min(4).max(16) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = data.kind === "wellness" ? "wellness_checks" : "diversion_requests";
    const since = new Date(Date.now() - 10 * 60_000).toISOString();
    const { data: row } = await supabaseAdmin.from(table).select("id").eq("city_id", data.cityId).eq("tracking_code", data.code).gte("created_at", since).maybeSingle();
    if (!row) return { ok: false };
    const c = await loadCity(data.cityId);
    if (!shouldAlert(data.kind, c.settings.notifications.urgentOnly)) return { ok: true };
    const text = alertText(c.name, data.kind, data.code);
    await Promise.allSettled([
      sendEmail(c.settings, c.secrets, validEmails(c.settings.notifications.alertEmails), `New ${data.kind} request ${data.code}`, text),
      sendSms(c.settings, c.secrets, validPhones(c.settings.notifications.alertPhones), text),
    ]);
    return { ok: true };
  });

/** Supervisor: send a test message to the city's own alert contacts. */
export const sendIntegrationTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ channel: z.enum(["email", "sms"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: me } = await context.supabase.from("profiles").select("city_id").eq("id", context.userId).maybeSingle();
    const { data: role } = await context.supabase.rpc("staff_role", { _uid: context.userId });
    if (!me?.city_id || role !== "supervisor") throw new Error("Supervisor access required");
    const c = await loadCity(me.city_id);
    const text = `CivicReach ${c.name}: this is a test message. Your ${data.channel === "email" ? "email" : "text message"} connection works.`;
    const result = data.channel === "email"
      ? await sendEmail(c.settings, c.secrets, validEmails(c.settings.notifications.alertEmails), "CivicReach test message", text)
      : await sendSms(c.settings, c.secrets, validPhones(c.settings.notifications.alertPhones), text);
    return { result };
  });
