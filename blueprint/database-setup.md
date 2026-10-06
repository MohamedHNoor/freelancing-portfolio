# Database foundation

The database foundation is ready for owner authentication in 16b. It adds no
route, user, seed or live auth instance. Provider setup and connectivity are
unverified.

Feature 16a first shipped this foundation on Drizzle with a self-hosted Better
Auth schema. The `fix/prisma-neon-auth` change replaced it on 2026-10-07:
**Prisma ORM 7** is the ORM and migration tool, and **Neon's Managed Better
Auth** (`@neondatabase/auth`) owns identity. The 16a archive in
`blueprint/history/features/` still describes the Drizzle version as it was
shipped. The Drizzle SQL was never applied anywhere, so nothing needs migrating.

## Configuration boundaries

Copy the variable names from `.env.example` into private local configuration.
Never commit, print or paste connection strings into review documents.

| Variable | Intended target | Consumer |
|---|---|---|
| `DATABASE_URL` | Neon pooled URL for the selected development/production branch | Lazy server-only `getDb()` |
| `DATABASE_URL_UNPOOLED` | Direct URL for the explicitly approved migration/Studio target | Live Prisma tools only |
| `TEST_DATABASE_URL` | Isolated test branch or local PostgreSQL | Reserved for future integration tests |

Keep Neon's supplied TLS options, including `sslmode=require`. Local PostgreSQL
URIs are supported too. Validation accepts `postgres:` and `postgresql:` with
a host and database name, preserves encoded credentials/query options, and
reports only the variable name on failure. There is no cross-variable fallback.

Runtime imports perform no env parsing, pool creation or database call. First
`getDb()` access validates `DATABASE_URL`, then creates one process-local `pg`
pool (`max: 5`, `idleTimeoutMillis: 5000`), attaches it using
`attachDatabasePool`, and caches a `PrismaClient` built on
`new PrismaPg(pool)`. Driver/query failures remain failures. Public routes do
not import this access path.

`prisma.config.ts` decides per command what a Prisma tool may see:

- **Live tools** (`prisma migrate deploy`, `migrate status`, `migrate resolve`,
  `prisma studio`) load env files using
  Next's `loadEnvConfig`: existing process variables take precedence, followed by
  environment-specific local, generic local, environment-specific and generic
  files. Production tooling uses `NODE_ENV=production`; otherwise it follows
  development env-file precedence. They require a valid `DATABASE_URL_UNPOOLED`
  and fail before connecting when it is missing or invalid.
- **Every other command** loads no private env file and receives the
  placeholder `postgresql://offline.invalid/offline`. Prisma 7's schema engine
  needs a URL even for an offline `migrate diff --from-empty`. The `.invalid`
  name can never resolve, so an accidental `migrate dev`, `db push` or
  `migrate reset` fails instead of reaching a real database.

Unit tests exercise this boundary without launching either live command.

## Schema layout

- `prisma/schema.prisma` holds only the `generator` and `datasource` blocks.
- Dashboard models arrive with their features, one file per table group in
  `prisma/models/` (`clients.prisma`, `projects.prisma`, ...). The config points
  `schema` at the `prisma/` directory, so Prisma combines every file.
- Tables and columns are snake_case through `@@map`/`@map`; model and field names
  stay PascalCase/camelCase in TypeScript.
- Migrations live in `prisma/migrations/`, beside `schema.prisma`, with
  `migration_lock.toml`. They are committed and reviewed in the feature diff.
- The generated client goes to `src/generated/prisma` (git-ignored) and is
  imported as `@/generated/prisma/client`.

**No auth models.** Managed Better Auth stores `user`, `session`, `account` and
`verification` in the `neon_auth` schema of each Neon branch and manages that
schema itself. Prisma Migrate must never create, alter or drop it.

When feature 17 adds the first `owner_id`, reference `neon_auth.user(id)`, a
`uuid`, from `owner_id uuid`. Prisma 7.10 needs all of the following for that,
checked offline against the installed CLI on 2026-10-07:

- **`experimental: { externalTables: true }`** in `prisma.config.ts`, alongside
  `tables: { external: ["neon_auth.user"] }`. Without the flag the config does
  not load. External tables are an experimental Prisma feature.
- **`schemas = ["public", "neon_auth"]`** on the datasource, and `@@schema` on
  *every* model once multi-schema is on.
- **A read-only `NeonAuthUser` model** (`@@map("user")`,
  `@@schema("neon_auth")`) with only the columns the app reads.
- **`migrations.initShadowDb`**, an SQL script that creates
  `neon_auth.user (id uuid primary key)` in the shadow database before migrations
  are replayed. Without it, the replayed foreign key fails, because a fresh
  shadow database has no `neon_auth` schema.

With these, the offline diff creates only application tables and emits
`REFERENCES "neon_auth"."user"("id") ON DELETE RESTRICT`, with no `neon_auth`
DDL. Any database that applies the migrations must already have
`neon_auth.user`. On Neon branches, enabling Auth creates it. A local
integration database needs the same stub before `migrate deploy`.

At this point the schema has no models, so there is no migration yet.

## Reproducible offline generation

Use the lockfile with `npm ci`. Prisma 7.10 needs Node 20.19+, 22.12+ or 24+.
`prisma`, `@prisma/client` and `@prisma/adapter-pg` are pinned to the same
**7.10.0**. npm's `latest` tag on the `prisma` CLI points at an 8.0 release
candidate, so upgrade all three together, deliberately.

```sh
npm run db:generate      # prisma generate; also runs on npm install
npx prisma validate
```

Client generation reads only the schema and config, needs no credentials, and
writes nothing outside `src/generated/prisma`. `npm run build` and
`npm run preflight` also run it first, because Vercel can restore a cached
`node_modules` without running `postinstall`, which would leave the git-ignored
client missing. Outside production, `getDb()` keeps its client on `globalThis`,
so dev hot reloads reuse one client and pool.

## Authoring migrations

- **The first migration** (feature 17) can be written offline, because it starts
  from an empty database:

  ```sh
  npx prisma migrate diff --from-empty --to-schema prisma --script \
    -o prisma/migrations/<YYYYMMDDHHMMSS>_<name>/migration.sql
  ```

  Add `prisma/migrations/migration_lock.toml` (`provider = "postgresql"`) in the
  same change.
- **Later migrations** need the previous state. `prisma migrate diff
  --from-migrations prisma/migrations --to-schema prisma --script` replays the
  committed migrations into a **shadow database**, configured as
  `datasource.shadowDatabaseUrl`. Point it at a disposable, empty database (local
  PostgreSQL or a throwaway Neon branch), never at development, test or
  production. `migrations.initShadowDb` prepares the `neon_auth.user` stub in it
  (see Schema layout). Feature 17 adds that variable and a documented script when the
  second migration is first needed.
- Prisma cannot express check constraints or sequences, and partial indexes need
  the `partialIndexes` preview feature. Add those as hand-written SQL in the
  generated `migration.sql`, reviewed in the same diff.
- Never use `prisma db push` or `prisma migrate dev` against a shared Neon branch.
  Never hand-edit an applied migration to hide drift.

## Managed Better Auth

Identity is Neon's managed Better Auth service, not a library running in this
app. Feature 16b wires it in, following Neon's Next.js "API methods" quickstart
(<https://neon.com/docs/auth/quick-start/nextjs-api-only>):

- Enable Auth per branch in the Neon Console (Project → Branch → Auth), with the
  `neon neon-auth enable` CLI, or with the Neon MCP `provision_neon_auth` tool.
  Every branch gets its own isolated auth environment and auth URL, and branches
  copy the auth data of their parent.
- `NEON_AUTH_BASE_URL` (that branch's Auth URL) and `NEON_AUTH_COOKIE_SECRET`
  (32+ characters, `openssl rand -base64 32`) are the only new variables.
- `@neondatabase/auth` is a pre-1.0 beta (0.5.0-beta on 2026-10-07). Neon's
  managed service runs Better Auth 1.4.18. Pin the SDK exactly.
- Email/password, verification, password reset, sign-up disabling, trusted
  domains and the email provider are branch settings, not app code. Neon's shared
  SMTP sender delivers verification codes only; verification links and
  production need custom SMTP, planned as Resend's SMTP relay (confirmed in 16b).
- Localhost origins are pre-approved trusted domains by default. Production and
  every preview origin must be added per branch (`neon neon-auth domain add
  https://...`), or redirects fail with `invalid domain`.
- Two-factor sign-in is not available on Managed Better Auth yet (roadmap).
  Feature 23 plans it; see the architecture's phase 2b risks.
- Safari blocks the auth cookies on plain-HTTP localhost; use
  `npm run dev -- --experimental-https` there.

## Named-target migration handoff

The intended Neon project uses PostgreSQL 17 in `aws-ap-southeast-2`, adjacent to
Vercel `syd1`. Managed Better Auth is available in AWS regions and runs in the
database's region. These settings and the following branches must be confirmed
later:

- `development`: local development and Vercel Preview.
- `test`: isolated integration runs; never production data.
- `production`: protected branch with approved backups/restore preparation.

Before a live operation, identify the project, branch, database and environment
without exposing its URI; review the exact SQL diff and obtain separate approval
for that named target. Set its direct URL through private configuration, keeping
runtime/test targets separate. Only after approval:

```sh
npm run db:migrate       # prisma migrate deploy
```

`migrate deploy` applies only committed migrations. It uses no shadow database,
never resets, and records each migration in `_prisma_migrations`. Record the target
and migration result, then verify the applied schema through separately approved
live checks. For production, confirm the restore window and take the planned
snapshot before applying SQL; migrate before promoting the deployment. Builds,
install scripts and unit tests never apply migrations.

**If a migration fails** on a named target, `migrate deploy` stops (P3009) and
refuses further migrations until the failed one is resolved. Recovery is a live
operation on that same named target, and each command needs its own approval:

1. `npx prisma migrate status` reports the applied, pending and failed
   migrations.
2. Inspect what the failed SQL left behind, through separately approved checks.
3. Undo any partial changes by hand, then run `npx prisma migrate resolve
   --rolled-back <migration>` and fix the migration in a new reviewed change.
   Alternatively, finish the change by hand and run `npx prisma migrate resolve
   --applied <migration>`.
4. Run `npm run db:migrate` again.

For production, restore from the pre-migration snapshot instead when the partial
state is unclear. Never edit `prisma.config.ts` to reach a database another way.

`npm run db:studio` also opens a live database tool and needs separate approval.
It uses the direct URL. Neither live command has been run. No provider resource,
integration harness or production deployment exists yet.

## Verification and next feature

```sh
npx tsc --noEmit
npm run lint
npm test
npm run build
env DATABASE_URL= DATABASE_URL_UNPOOLED= TEST_DATABASE_URL= npm run build
```

The last command sets all DB configuration to empty values so dotenv cannot
restore values from private files. The existing `NEXT_PUBLIC_SITE_URL` build
requirement is unchanged. Builds must keep every public page static/SSG and
introduce no auth/dashboard endpoint. This is offline verification, not proof
of successful migrations, connectivity or authenticated behavior.

Focused tests cover redacted validation, independent tool/runtime URLs, the
live/offline command split, import laziness, pool reuse/options, adapter wiring
and failure propagation, without connecting to PostgreSQL.

Feature 16b supplies the Managed Better Auth server instance, the auth route
handler, owner authorization and auth email configuration. Feature 16c supplies
auth UI and the protected dashboard shell. Parent Feature 16 remains incomplete
until all three leaves finish.

Official references:

- [Prisma config](https://www.prisma.io/docs/orm/reference/prisma-config-reference)
- [Prisma `migrate diff`](https://www.prisma.io/docs/orm/reference/prisma-cli-reference#migrate-diff)
- [PostgreSQL driver adapter](https://www.prisma.io/docs/orm/overview/databases/postgresql)
- [Externally managed tables](https://www.prisma.io/docs/orm/prisma-schema/data-model/externally-managed-tables)
- [Managed Better Auth](https://neon.com/docs/auth/overview)
- [Next.js server SDK](https://neon.com/docs/auth/reference/nextjs-server)
- [Vercel pool attachment](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package#attachdatabasepool)

The installed 7.10.0 CLI governs this implementation where newer docs differ.
