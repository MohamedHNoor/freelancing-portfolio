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
| `TEST_DATABASE_URL` | A local PostgreSQL database named `portfolio…_test`, in `.env.test.local` | `npm run test:integration` only |

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

Every `owner_id` references `neon_auth.user(id)`, a `uuid`. Prisma 7.10 needs
all of the following for that. Feature 17a configured them; they were first
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

The first migration, `20261008131745_clients_and_activities` (feature 17a), creates the
`currency`, `activity_actor` and `activity_type` enums and the `clients` and
`activities` tables, with their indexes and their `RESTRICT` foreign keys to
`neon_auth.user`. It was generated offline with `migrate diff --from-empty` and
contains no `neon_auth` DDL. `activity_type` holds only the client values; later
features add theirs with `ALTER TYPE ... ADD VALUE`, and add the project,
milestone, task and payment-request columns to `activities` with their tables.

**No Neon branch has this migration yet.** Feature 17b applies it to
`development` through the named-target handoff below, with its own approval.

## Local integration tests

`npm run test:integration` runs `tests/integration/**` against a real local
PostgreSQL database; `npm test` excludes that folder and never needs a database.

- Put `TEST_DATABASE_URL` in `.env.test.local` (git-ignored). Vitest runs with
  `NODE_ENV=test`, and Next's env loader skips `.env.local` in that mode.
  The local database is `portfolio_test` on Homebrew PostgreSQL
  (`createdb portfolio_test`).
- **Every run rebuilds that database.** Global setup drops and recreates the
  `public` and `neon_auth` schemas, creates the `neon_auth.user (id uuid)` stub,
  applies every committed `migration.sql` in name order, and seeds two owners.
  Each test starts from empty `clients` and `activities` tables.
- The harness refuses to connect unless the URL's host is `localhost`,
  `127.0.0.1` or `::1` and the database name starts with `portfolio` and ends in
  `_test`. Other local projects' `_test` databases are therefore out of reach.
  The error names only the variable.
- The workers point `DATABASE_URL` at the test URL before `getDb()` is first
  used, and `server-only` is aliased to an empty module.
- Local PostgreSQL is 14 and Neon runs 17. The migrations use nothing newer than
  `gen_random_uuid()` (core since 13); recheck if a later migration does.

Every service that loads a record has a test proving that a second owner gets
`NotFoundError` and that the first owner's data is unchanged.

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
(<https://neon.com/docs/auth/quick-start/nextjs-api-only>).

**In the app (feature 16b):**

- `src/lib/env.ts` `getAuthEnv()` validates `NEON_AUTH_BASE_URL` (https, path
  kept), `NEON_AUTH_COOKIE_SECRET` (32+ characters) and `OWNER_EMAIL` (trimmed,
  lowercased) on first use. Errors name the variable only.
- `src/lib/auth/server.ts` `getAuth()` lazily builds one `createNeonAuth`
  instance from `@neondatabase/auth` `0.5.0-beta` (pinned), with
  `sessionDataTtl: 60` and `logLevel: "silent"`.
- `src/app/api/auth/[...path]/route.ts` is the same-origin proxy to Neon. It
  forwards only `GET get-session` and `POST sign-out` (everything else is 404)
  and resolves the SDK handler inside the request.
- `getSessionReader()` in the same module is a second SDK instance for page
  renders: its request context drops cookie writes, which Next forbids while a
  Server Component renders.
- `src/server/auth/session.ts` holds the owner check:
  - `getOwner()` admits only a verified session whose email is `OWNER_EMAIL`.
  - `requireOwner()` is for pages and redirects to `/login`.
  - `requireOwnerForAction()` is for Server Actions and returns
    `UNAUTHENTICATED`.
- `src/actions/auth.ts` holds the Server Actions 16c's forms call: `signIn`,
  `signOut`, `requestPasswordReset`, `resetPassword` and `resendVerification`.
  - A non-owner sign-in is signed straight back out.
  - Reset and verification requests answer identically for every address, and
    only the owner's reaches Neon.
  - Logs carry error codes only.

**On each branch (Neon settings):**

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

### Applied: `development` branch (2026-10-07, feature 16b step 7)

Through the Neon MCP, with the owner's approval:

| Setting | Value |
|---|---|
| Project | `mhnoor-portfolio` (`snowy-voice-62561189`), PostgreSQL 17, `aws-ap-southeast-2` |
| Branch | `development` (`br-royal-darkness-a7qoz708`), created from `production` (`br-dawn-unit-a7e6kd3e`) |
| Auth | Managed Better Auth provisioned, Auth URL `https://ep-rough-darkness-a7rwukh4.neonauth.ap-southeast-2.aws.neon.tech/neondb/auth` (public endpoint, not a secret) |
| App name | `Mohamed Noor` |
| Owner account | `info@mohamedhnoor.com`, created by admin (no password set through chat) |
| Trusted domains | none yet; localhost is pre-approved (`allow_localhost: true`) |

`production` was not touched beyond being the parent of the new branch.

**Legacy tables removed (2026-10-07, owner's request).** Both branches carried
eight `public` tables from an earlier, unrelated Prisma version of the
portfolio: `ContactInquiry`, `Project`, `ProjectTag`, `Service`, `Skill`, `Tag`,
`Testimonial` and `_prisma_migrations`. They were dropped on both branches in
one non-cascading `DROP TABLE` per branch.

- Snapshot `snap-cold-surf-a79k7mg1` (`production`) was taken first and holds
  their data. Neon does not snapshot child branches, and `development` had been
  copied from `production` minutes earlier.
- `production` is now empty. `development` holds only Neon's `neon_auth` tables.
- Feature 17's first migration starts from an empty `public` schema.

**Completed 2026-10-07.** The shared Google provider was removed through the
MCP. The owner made the remaining changes in the Console, and the config read
back as follows:

- sign-up off
- verification required, by link
- custom SMTP `smtp.resend.com:465` as `Mohamed Noor <auth@mohamedhnoor.com>`
- no OAuth providers
- trusted origin `https://www.mohamedhnoor.com`

The owner account exists, unverified and with no password, until 16c's flow.
The original task list:

1. Email and password: turn **sign-up off**. Turn **email verification
   required** on, with the verification method set to **link** (it defaults to
   OTP codes).
2. OAuth: remove the default **shared Google** provider. Email and password is
   the only sign-in method.
3. Email provider: switch from the shared sender to **custom SMTP**, with
   Resend's relay (`smtp.resend.com`, username `resend`, password a Resend API
   key) and a sender on `mohamedhnoor.com`.
4. Trusted domains: add the Vercel Preview origin once it is known.
5. Put `NEON_AUTH_BASE_URL` (above), `NEON_AUTH_COOKIE_SECRET`
   (`openssl rand -base64 32`) and `OWNER_EMAIL` into `.env.local` and Vercel
   Preview.

Then re-read the config (`get_neon_auth_config`) to confirm. The owner sets
their password through 16c's forgot-password flow, and verifies their email
through the verification link if the account is not already verified.

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
handler, owner authorization, the auth actions, and the `development` branch's
auth configuration (recorded below once applied). Feature 16c supplies
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
