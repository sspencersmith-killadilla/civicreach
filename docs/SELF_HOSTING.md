# Self-hosting CivicReach

This guide is for a technical administrator deploying the repository outside Lovable’s hosted environment. Review local security, privacy, accessibility, retention, and public-records requirements before handling real client data.

## License

CivicReach is released under the MIT License (see `LICENSE` in the repository root). You may self-host, modify, and redistribute it; keep the copyright and license notice in copies.

## Architecture

- TanStack Start v1, React 19, TypeScript, Tailwind CSS v4.
- Supabase-compatible Auth, Postgres, Storage, and Realtime.
- Server functions perform city provisioning and staff invitations. The service key is required only on the server.
- Each city has a `cities` row and a unique `/c/<slug>` resident URL. Application records carry a `city_id`; row-level security restricts staff to their assigned city.
- Staff roles live in `user_roles`, separate from editable profile details. New auth users receive no staff role until city provisioning or a supervisor invitation completes.

## Prerequisites

- Git and Bun (the repository uses `bun.lock`).
- A Supabase project, or a self-hosted Supabase stack with Auth, Postgres, Storage, and Realtime enabled.
- A host compatible with the TanStack Start/Nitro build output.
- An HTTPS public URL and an email provider for account confirmation and invitations.

## 1. Install

```sh
git clone YOUR_REPOSITORY_URL civicreach
cd civicreach
bun install
```

## 2. Apply the database schema

Apply every SQL file in `drizzle/migrations/` in filename order against the intended empty project. Do not skip `0002_add_isolated_city_workspaces.sql`; it contains city separation, protected roles, storage policies, and city provisioning.

With a direct Postgres connection:

```sh
for file in drizzle/migrations/*.sql; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
done
```

Alternatively, run each file in order through the Supabase SQL editor. These files include the initial Demo City and its sample requests and $25,000 fund. Remove or clearly retain that demo workspace before launch; never place live client records in it.

The migration enables realtime for the two dispatch tables. Confirm the publication exists on a self-hosted Supabase stack before applying the initial schema.

## 3. Create storage buckets

Create both buckets as private (`public = false`). Object access is controlled by the policies in the schema, including the city ID at the start of every object path.

```sql
insert into storage.buckets (id, name, public)
values
  ('client-documents', 'client-documents', false),
  ('wellness-photos', 'wellness-photos', false)
on conflict (id) do nothing;
```

Residents can only upload image files to `<active-city-id>/<tracking-code>/<file>` in `wellness-photos`; nobody can overwrite existing files. Staff can only read or manage objects belonging to their assigned city.

## 4. Configure environment variables

```dotenv
# Browser-safe public URL and publishable key
VITE_SUPABASE_URL=https://YOUR_PUBLIC_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY

# Server runtime; use the internal service URL where appropriate
SUPABASE_URL=https://YOUR_SERVER_REACHABLE_SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Use a legacy anon JWT as the publishable value only if that is what your Supabase version issues. Never prefix the service key with `VITE_`, expose it in client code, or commit it to the repository.

For local development, place these values in the environment mechanism supported by your deployment tooling. Run:

```sh
bun run dev
```

The development server listens on the port reported by Vite.

## 5. Configure Auth and email

1. Enable email/password authentication.
2. Set **Site URL** to the HTTPS origin where CivicReach is installed.
3. Allow these redirect URLs on that origin:
   - `/auth`
   - `/auth?invite=1`
   - `/city-signup`
4. Configure a production email sender and confirm delivery.
5. Keep email confirmation enabled for city supervisors.
6. Do not enable anonymous sign-ins.

The app generates supervisor confirmation and staff invitation links for private delivery; supervisors copy and share invitation links themselves. Request alert emails and texts are sent through each city's own Resend and Twilio accounts, entered in **Console → Settings → Integrations**. Those keys are stored per city, write-only, and read only on the server.

## 6. Build and deploy

Create a production build:

```sh
bun run build
```

Deploy the generated TanStack Start/Nitro output using a target supported by your host. The Lovable configuration defaults to an edge/Cloudflare-compatible target. For a Node server, select Nitro’s `node-server` preset in your deployment configuration, build with the same environment variables, and run the generated server entrypoint (normally `.output/server/index.mjs`). Confirm the output path produced by your installed Nitro version rather than assuming it.

`bun run preview` is suitable for local build inspection, not as a complete production deployment strategy.

Requirements for any host:

- HTTPS and secure cookies.
- All server environment variables available to SSR and server functions.
- Public browser access to `VITE_SUPABASE_URL`.
- Server network access to `SUPABASE_URL`.
- No shared public caching for authenticated responses.
- A process supervisor or managed platform, health checks, and log retention appropriate for sensitive operations.

## 7. First city and staff

1. Open `/city-signup` on your installation.
2. Create a city and supervisor account.
3. Confirm the email and sign in.
4. Create a staff invitation in **Console → Team** and complete it in a private browser window.
5. Open the city resident URL in a signed-out browser and submit test requests.
6. Confirm the new requests appear only in that city’s console.

The public demo switcher can create shared accounts, but those accounts are confined to Demo City. Set `VITE_DEMO_MODE=off` to hide it; do not repurpose those accounts for live operations.

## 8. Production verification

At minimum, verify:

- A new city receives its own slug, supervisor role, and fund.
- An unassigned auth user cannot open staff records.
- Outreach and supervisor accounts from one city cannot select, update, or grant funds in another city.
- Public users can insert, but cannot read, request records.
- Document and wellness-photo object paths enforce the same city boundary.
- Offline entries from two city accounts on one device cannot cross-sync.
- Backups restore successfully and realtime reconnects after a network interruption.
- Security headers, email links, password reset procedures, logs, monitoring, and rate limiting meet local requirements.

Run the repository tests with:

```sh
bunx vitest run
```

## Operational limitations to address before a live launch

- Email and SMS alerts work once a city connects its own Resend/Twilio account. There is no built-in municipal 311, automatic ride booking, automatic payment, push notification, emailed staff invitation, or resident status text; staff follow the links and steps each city enters.
- The response timer is an interface target, not a service-level guarantee.
- Offline encounter storage is not a substitute for an encrypted city-managed device or a complete offline application cache.
- Public forms include a hidden honeypot field and minimum fill time. Add IP rate limiting or CAPTCHA at your host if your exposure needs it.
- Complete a formal security and privacy review before using real client data.

## Production options

- Set `VITE_DEMO_MODE=off` to hide the Demo City role switcher on your deployment.
- Nightly retention cleanup needs the `pg_cron` extension; it runs at 03:17 server time for cities that are live.
