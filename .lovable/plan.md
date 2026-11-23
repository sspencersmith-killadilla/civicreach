# CivicReach: city-configurable production readiness

Goal: every launch requirement becomes a setting the city's supervisor fills in during signup (guided setup wizard) and can change later in **Console → City settings**. Nothing city-specific stays hard-coded.

## 1. Guided city setup wizard (after signup)
Signup stays short (city, supervisor, password). On first sign-in the supervisor sees a step-by-step checklist they can finish in any order, with a "Launch readiness" progress bar. The resident link stays in "pilot / not public" mode until required steps are done.

Steps:
1. **City profile** – display name, logo, accent color, languages, time zone, public contact info.
2. **Hours & coverage** – weekly outreach hours, holiday closures, after-hours message shown to residents.
3. **Emergency & escalation** – local emergency number, crisis line (default 911 / 988, editable), escalation rules shown to staff, custom disclaimer.
4. **Response targets** – per-urgency response targets (replaces the fixed 45 min), shown as targets not guarantees.
5. **Intake forms** – turn options on/off and add custom ones: living situations, barriers, wellness needs, field service chips, document types; optional extra questions.
6. **Grant rules** – min/max amount, worker self-approval limit, supervisor limit, payment methods, fund cycles (multiple funds, start/end dates, top-ups with audit log).
7. **Service hubs & transport** – city's own shelters/hubs (address, map pin, hours), ride providers and how to request them (phone, link, or manual).
8. **Teams & zones** – zones list, staff invites with zone assignment, on-call schedule.
9. **Notifications** – who gets alerted for which urgency, by email (and SMS later); resident confirmation messages.
10. **Privacy & retention** – consent wording, how long records/documents are kept before automatic purge, public-records contact.
11. **Go live** – checklist review, test submission, then switch resident link to public.

## 2. Features needed for real operations
- **Email**: staff invitations, password reset, supervisor confirmation, and urgent-request alerts sent from your own domain (needs a sender domain set up once for the whole app).
- **Abuse protection**: bot check and rate limits on resident forms, per-city daily caps.
- **Demo separation**: demo role switcher and Demo City hidden on the live domain; available only on a demo address.
- **Audit log**: who claimed, approved, paid, viewed a document, or changed settings.
- **Data export & retention**: CSV export for reporting; scheduled purge per city's retention setting.
- **Reporting dashboard**: requests, response times vs. target, grants by barrier, fund burn.
- **Resident status lookup**: residents check their tracking code status (no personal details shown).
- **Multi-language**: resident pages in city-selected languages (English/Spanish to start).
- **SMS (phase 2)**: optional, requires a texting provider account per city or shared.

## 3. Rollout phases
1. Settings foundation + wizard + city-driven forms, hours, emergency, targets, grant rules, hubs (no outside services needed).
2. Email, abuse protection, demo separation, audit log.
3. Reporting, export/retention, status lookup, translations.
4. SMS and optional transport/payment integrations.

## Technical details
- New `city_settings` table (1:1 with `cities`, typed JSONB sections with versioned schema validated by zod) plus normalized tables where rows matter: `city_option_sets` (form choices), `service_hubs`, `city_funds`, `zones`, `notification_rules`, `audit_log`. All carry `city_id` with existing RLS pattern; supervisor-only writes via `staff_role()`.
- Public read of only safe settings through a `public_city_config` security-definer function by slug (never contact rules or staff data).
- Grant thresholds move from constants to settings; `submit_micro_grant` / `decide_micro_grant` RPCs read limits from `city_settings`; `grantRouting` in `src/lib/civic.ts` takes limits as arguments; tests updated with the current $250 / $1,000 defaults.
- Enum columns (living_situation, barrier_type, urgency_tags, service_chips, doc_type) relaxed to text validated against the city's option set via trigger; existing values seeded as defaults for every city.
- Readiness computed by a SQL function; resident routes show "pilot" notice until `go_live` set.
- Email via Lovable app emails (templates for invite, reset, alert); auth emails via custom auth templates. Bot check via Cloudflare Turnstile server-verified in the submit server function; rate limit table keyed by hashed IP.
- Demo switcher gated by hostname/env flag.
- Retention purge via scheduled server route under `/api/public/` verified by cron secret.
- Docs (`USER_GUIDE.md`, `SELF_HOSTING.md`, `/guide`) updated per phase.
