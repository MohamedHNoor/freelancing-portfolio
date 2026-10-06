import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, it } from "vitest";

it("isolates the real CLI's startup dotenv and config discovery from project files and inherited overrides", () => {
  const fixture = mkdtempSync(join(tmpdir(), "portfolio-generator-test-"));
  const trace = join(fixture, "trace.json");
  const guard = join(fixture, "guard.cjs");
  const variables = ["DATABASE_URL", "DATABASE_URL_UNPOOLED", "TEST_DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"];
  try {
    for (const file of ["scripts/generate-auth-schema.mjs", "scripts/auth-schema.config.ts", "src/lib/auth-schema.ts"]) {
      const destination = join(fixture, file);
      mkdirSync(resolve(destination, ".."), { recursive: true });
      copyFileSync(resolve(file), destination);
    }
    symlinkSync(resolve("node_modules"), join(fixture, "node_modules"), "dir");
    for (const file of [".env", ".env.local"]) {
      writeFileSync(join(fixture, file), variables.map((key) => `${key}=fake-dotenv-sentinel`).join("\n"));
    }
    // The guard records attempts before opening files and never inspects private data.
    writeFileSync(guard, `
      const fs = require("node:fs");
      const path = require("node:path");
      if (process.argv[1].endsWith("auth/dist/index.mjs")) {
        const reads = [];
        const original = fs.readFileSync;
        fs.readFileSync = function(file, ...args) {
          if (typeof file === "string" && path.basename(file).startsWith(".env")) {
            const absolute = path.resolve(file);
            reads.push(absolute);
            if (absolute.startsWith(${JSON.stringify(fixture)} + path.sep)) throw new Error("Blocked fixture dotenv read");
          }
          return original.call(this, file, ...args);
        };
        process.on("exit", () => fs.writeFileSync(${JSON.stringify(trace)}, JSON.stringify({
          cwd: process.cwd(), reads,
          restored: ${JSON.stringify(variables)}.filter(key => process.env[key] !== undefined),
          overrides: Object.keys(process.env).filter(key => key.startsWith("DOTENV_CONFIG_") || key === "DOTENV_KEY"),
        })));
      }
    `);
    const result = spawnSync(process.execPath, [join(fixture, "scripts/generate-auth-schema.mjs")], {
      cwd: fixture,
      env: {
        ...process.env,
        ...Object.fromEntries(variables.map((key) => [key, "fake-inherited-sentinel"])),
        NODE_OPTIONS: `--require=${guard}`,
        DOTENV_CONFIG_PATH: join(fixture, ".env"),
        DOTENV_CONFIG_OVERRIDE: "true",
        DOTENV_CONFIG_DEBUG: "true",
        DOTENV_CONFIG_DOTENV_KEY: "fake-vault-sentinel",
        DOTENV_KEY: "fake-vault-sentinel",
      },
      encoding: "utf8",
      timeout: 20_000,
    });
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    const evidence: { cwd: string; reads: string[]; restored: string[]; overrides: string[] } = JSON.parse(readFileSync(trace, "utf8"));
    expect(evidence.cwd).not.toBe(fixture);
    expect(evidence.reads.length).toBeGreaterThan(0); // Exercises the actual startup dotenv import.
    expect(evidence.reads.every((file) => file.startsWith(evidence.cwd + "/"))).toBe(true);
    expect(evidence.restored).toEqual([]);
    expect(evidence.overrides).toEqual([]);
    expect(readFileSync(join(fixture, "src/db/schema/auth.ts"), "utf8"))
      .toBe(readFileSync(resolve("src/db/schema/auth.ts"), "utf8"));
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}, 25_000);
