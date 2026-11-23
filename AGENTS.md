<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## CivicReach architecture
- City isolation is enforced by `city_id` plus RLS on every operational table and by city-prefixed Storage paths; staff reads and writes must always stay inside `profiles.city_id`.
- Staff roles live in `user_roles`, separate from editable profiles; `is_staff()` / `staff_role()` use security-definer functions to prevent self-promotion. New auth users have no city role until trusted provisioning or invitation completes.
- Public resident URLs use `/c/<city-slug>`; public users may insert into active cities but cannot read requests back.
- Fund-moving actions go through city-scoped `submit_micro_grant` / `decide_micro_grant` RPCs; the client never updates `diversion_fund` directly.
- Grant threshold logic is mirrored in `src/lib/civic.ts` `grantRouting` (UI only) and tested; change both together.
- Field encounters always enqueue to localStorage first (`src/lib/offline-queue.ts`) and upsert by `client_ref`; entries carry `city_id` so one device cannot cross-sync city accounts.
- The demo role switcher uses shared accounts confined to Demo City; real city staff use supervisor-created invitations.
- PWA is manifest-only (no service worker) to avoid stale-cache issues in preview.
- City operating rules (hours, emergency numbers, targets, intake options, grant limits, hubs, privacy, go-live) live in `city_settings.settings` JSONB, merged over defaults by `src/lib/city-settings.ts`; supervisors write only via `update_city_settings` RPC, residents read only `public_city_config(slug)`. Why: every city configures itself without code changes.
- Grant RPCs read limits from `city_settings` via `city_grant_limit`; `grantRouting` takes the same limits. Why: one source of truth per city.
