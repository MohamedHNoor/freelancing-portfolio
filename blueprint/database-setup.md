# Database foundation — Feature 16a

The database foundation is ready for owner authentication in 16b. It adds no
route, user, seed or live auth instance. The initial migration is generated and
reviewed locally, **not applied**. Provider setup and connectivity are unverified.

## Configuration boundaries

Copy the variable names from `.env.example` into private local configuration.
Never commit, print or paste connection strings into review documents.

| Variable | Intended target | Consumer |
|---|---|---|
| `DATABASE_URL` | Neon pooled URL for the selected development/production branch | Lazy server-only `getDb()` |
| `DATABASE_URL_UNPOOLED` | Direct URL for the explicitly approved migration/Studio target | Live Drizzle tools only |
| `TEST_DATABASE_URL` | Isolated test branch or local PostgreSQL | Reserved for future integration tests |

Keep Neon's supplied TLS options, including `sslmode=require`. Local PostgreSQL
URIs are supported too. Validation accepts `postgres:` and `postgresql:` with
a host and database name, preserves encoded credentials/query options, and
reports only the variable name on failure. There is no cross-variable fallback.

Runtime imports perform no env parsing, pool creation or database call. First
`getDb()` access validates `DATABASE_URL`, then creates one process-local pool
(`max: 5`, `idleTimeoutMillis: 5000`), attaches it using `attachDatabasePool`, and
caches the typed Drizzle instance with snake_case casing. Driver/query failures
remain failures. Public routes do not import this access path.

Migration and Studio config load env files using Next's `loadEnvConfig`: existing
process variables take precedence, followed by environment-specific local,
generic local, environment-specific and generic files. Production tooling uses
`NODE_ENV=production`; otherwise it follows development env-file precedence.
Both tools reject missing/invalid direct configuration before initializing a live
tool. Unit tests exercise this boundary without launching either command.

## Reproducible offline generation

Use the lockfile with `npm ci`. The auth generator uses Node's native TypeScript
support (Node 22.18+). The generator leaves the application's package module
mode unchanged; Node may emit a harmless module-type detection warning for the
shared TypeScript helper.

```sh
npm run auth:generate
npm run db:generate
```

`better-auth` and its official `auth` CLI are both pinned to **1.6.33**. The CLI
is invoked from the installed package with `generate --adapter drizzle --dialect
postgresql --yes`, a tooling-only options config, and temporary cwd/output.
The config enables database-backed rate limits and disables telemetry. It does
not create an auth instance, import the runtime pool, or supply placeholder
credentials. Both the actual child process cwd and the CLI's discovery cwd are
temporary, keeping startup dotenv and config-loader discovery away from private
app files. Database/auth-secret variables, dotenv path/options overrides and
vault keys are removed from its child environment. A regression test runs the
real pinned CLI in a disposable fixture, intercepts dotenv reads, and confirms
that fake project files cannot restore stripped variables.

The pinned generator returns five tables: `user`, `session`, `account`,
`verification`, `rate_limit`. The wrapper preserves adapter properties, keys,
constraints and indexes, then makes these explicit storage adjustments:

- All timestamps use PostgreSQL `timestamptz` to match the architecture.
- Session/account `updatedAt` gain a SQL `now()` default; native `$onUpdate`
  behavior is retained. Other generated lifecycle defaults remain intact.

The adjustment helper rejects unexpected table sets/date syntax before replacing
the committed schema. Future Better Auth upgrades require reviewing generator
output and compatibility before generating the next SQL migration.

Drizzle SQL generation reads only schema/config and requires no credentials or
private env files. Commit schema, SQL and `drizzle/meta/` together. The initial
`drizzle/0000_moaning_morlocks.sql` creates only these five auth tables, with
library-generated text IDs, unique email/session token/rate key, cascade user
foreign keys and supporting indexes. It contains no drops or seeds.

Running both generation commands again must produce identical schema/SQL/meta
and report no schema changes. Do not hand-edit migration metadata to hide drift.

## Named-target migration handoff

The intended Neon project uses PostgreSQL 17 in `aws-ap-southeast-2`, adjacent to
Vercel `syd1`. These settings and the following branches must be confirmed later:

- `development`: local development and Vercel Preview.
- `test`: isolated integration runs; never production data.
- `production`: protected branch with approved backups/restore preparation.

Before a live operation, identify the project, branch, database and environment
without exposing its URI; review the exact SQL diff and obtain separate approval
for that named target. Set its direct URL through private configuration, keeping
runtime/test targets separate. Only after approval:

```sh
npm run db:migrate
```

Record the target and migration result, then verify the applied schema through
separately approved live checks. For production, confirm the restore window and
take the planned snapshot before applying SQL; migrate before promoting the
deployment. Builds, install scripts and unit tests never apply migrations.

`npm run db:studio` also opens a live database tool and needs separate approval.
It uses the direct URL. Neither live command was run for 16a. No provider resource,
integration harness or production deployment is created by this feature.

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
requirement is unchanged. Builds must keep all 11 public pages static/SSG and
introduce no auth/dashboard endpoint. This is offline verification, not proof
of successful migrations, connectivity or authenticated behavior.

Vitest **4.1.11** retains the existing node suite/configuration and satisfies
Better Auth 1.6.33's peer range. Focused tests cover redacted validation, independent
tool/runtime URLs, import laziness, pool reuse/options, failure propagation,
schema constraints and generator adjustments without connecting to PostgreSQL.

Feature 16b must use the same pinned schema contract when configuring live auth
and rate limiting; it supplies owner registration, verification/reset email and
session authorization. Feature 16c supplies auth UI and the protected dashboard
shell. Parent Feature 16 remains incomplete until all three leaves finish.

Official references: [Better Auth CLI](https://better-auth.com/docs/concepts/cli),
[Drizzle adapter](https://better-auth.com/docs/adapters/drizzle),
[Drizzle configuration](https://orm.drizzle.team/docs/drizzle-config-file),
[Vercel pool attachment](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package#attachdatabasepool).
Installed 1.6.33 CLI help/types govern this implementation when newer docs differ.
