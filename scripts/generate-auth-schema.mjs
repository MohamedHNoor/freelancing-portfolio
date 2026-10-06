import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { normalizeAuthSchema } from "../src/lib/auth-schema.ts";

const directory = mkdtempSync(join(tmpdir(), "portfolio-auth-schema-"));
const output = join(directory, "schema.ts");
const generationEnv = { ...process.env, DO_NOT_TRACK: "1", BETTER_AUTH_TELEMETRY_DISABLED: "1" };
const privateVariables = ["DATABASE_URL", "DATABASE_URL_UNPOOLED", "TEST_DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL", "DOTENV_KEY"];
for (const key of Object.keys(generationEnv)) {
  if (privateVariables.includes(key) || key.startsWith("DOTENV_CONFIG_")) delete generationEnv[key];
}

try {
  // A temporary cwd keeps the CLI's dotenv discovery away from private app files.
  const generated = spawnSync(process.execPath, [
    resolve("node_modules/auth/dist/index.mjs"), "generate",
    "--cwd", directory, "--config", resolve("scripts/auth-schema.config.ts"),
    "--adapter", "drizzle", "--dialect", "postgresql", "--output", output, "--yes",
  ], { cwd: directory, env: generationEnv, stdio: "inherit" });
  if (generated.error) throw generated.error;
  if (generated.status !== 0) throw new Error("Offline auth schema generation failed.");
  const schema = normalizeAuthSchema(readFileSync(output, "utf8"));
  mkdirSync(resolve("src/db/schema"), { recursive: true });
  writeFileSync(resolve("src/db/schema/auth.ts"), schema);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
