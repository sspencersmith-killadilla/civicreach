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
- Staff role lives in `profiles.role`, writable only via service role (column-level UPDATE grants); RLS checks use `is_staff()`/`staff_role()` security-definer functions — prevents self-promotion.
- Fund-moving actions go through `submit_micro_grant` / `decide_micro_grant` RPCs; the client never updates `diversion_fund` directly — keeps approval thresholds server-enforced.
- Grant threshold logic is mirrored in `src/lib/civic.ts` `grantRouting` (UI only) and tested; change both together.
- Field encounters always enqueue to localStorage first (`src/lib/offline-queue.ts`) and upsert by `client_ref` — makes offline retries idempotent.
- Demo role switcher signs into shared demo accounts created by `ensureDemoAccount` server fn — lets reviewers preview staff tabs without sign-up.
- PWA is manifest-only (no service worker) — avoids stale-cache issues in preview.
