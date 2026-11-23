# CivicReach

CivicReach is a city-ready housing diversion, compassionate 311 outreach, and field casework application. Each municipality gets a separate workspace, staff team, diversion fund, and resident URL.

## License

CivicReach is free and open-source software under the [MIT License](LICENSE). Any city, nonprofit, or developer may use, copy, modify, self-host, and redistribute it, provided the copyright and license notice are kept.

## Product flows

- **Residents:** rapid housing help, mapped civilian wellness checks, and tracking-code status lookup without an account, in English or Spanish.
- **Outreach staff:** live dispatch, offline-first field encounters, flexible micro-grants, and consent-gated document storage.
- **Supervisors:** all outreach tools plus grant approval, invitation-only staff management, city settings, provider integrations, reports, CSV export, and retention cleanup.
- **Cities:** hosted self-service signup, isolated records, unique resident links, and optional self-hosting.

Open `/guide` in the app for the operations handbook. Repository guides:

- [City user guide](docs/USER_GUIDE.md)
- [Self-hosting guide](docs/SELF_HOSTING.md)

## Local development

Requirements: Bun and a configured Supabase-compatible backend.

```sh
bun install
bun run dev
```

Required environment variables are documented in [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md). Apply all files under `drizzle/migrations/` in filename order before using a new backend.

## Checks

```sh
bunx vitest run
bun run lint
bun run build
```

## Stack

TanStack Start, React, TypeScript, Tailwind CSS, Supabase Auth/Postgres/Storage/Realtime, and Lucide icons.

## Important launch limits

CivicReach is a pilot foundation, not a substitute for emergency services or municipal procurement controls. Before public use, connect the city's own email/SMS providers, document ride and payment steps, local retention and consent procedures, monitoring, backups, rate limiting, accessibility review, and a security assessment. The included Demo City must not hold live client records.
