import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME,
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  resolveTheme,
} from "@/lib/theme";

describe("resolveTheme", () => {
  it("resolves an explicit light preference", () => {
    expect(resolveTheme("light")).toBe("light");
  });

  it.each([
    ["dark", "an explicit dark preference"],
    ["", "an empty string"],
    ["Light", "the wrong case"],
    ["not-a-theme", "a value written by something else"],
  ])("falls back to dark for %o (%s)", (stored) => {
    expect(resolveTheme(stored)).toBe(DEFAULT_THEME);
  });

  it("falls back to dark when nothing is stored", () => {
    expect(resolveTheme(null)).toBe(DEFAULT_THEME);
    expect(resolveTheme(undefined)).toBe(DEFAULT_THEME);
  });
});

/** Runs the real pre-paint script against stubs, starting from the `dark` class
 *  the server always renders, and reports the theme it left applied.
 *
 *  Only `document` and `localStorage` are in scope, which is the point: the
 *  script is built by serializing a function, so any reference it carried to
 *  module scope would throw, be swallowed by its own catch, and silently ignore
 *  the stored preference. */
function runInitScript(
  stored: string | null,
  { storageThrows = false } = {},
): "dark" | "light" {
  const classes = new Set(["dark"]);
  const documentStub = {
    documentElement: {
      classList: {
        toggle(name: string, force: boolean) {
          if (force) {
            classes.add(name);
          } else {
            classes.delete(name);
          }
        },
      },
    },
  };
  const localStorageStub = {
    getItem(key: string) {
      if (storageThrows) {
        throw new Error("storage blocked");
      }
      return key === THEME_STORAGE_KEY ? stored : null;
    },
  };

  const run = new Function("document", "localStorage", THEME_INIT_SCRIPT) as (
    doc: typeof documentStub,
    storage: typeof localStorageStub,
  ) => void;
  run(documentStub, localStorageStub);

  return classes.has("dark") ? "dark" : "light";
}

describe("THEME_INIT_SCRIPT", () => {
  it("applies a stored light preference before paint", () => {
    expect(runInitScript("light")).toBe("light");
  });

  it("leaves the server-rendered dark default when nothing is stored", () => {
    expect(runInitScript(null)).toBe("dark");
  });

  it("leaves dark applied when storage throws", () => {
    // Some privacy modes throw on access rather than returning null.
    expect(runInitScript(null, { storageThrows: true })).toBe("dark");
  });

  it("inlines the storage key rather than referencing the constant", () => {
    expect(THEME_INIT_SCRIPT).toContain(JSON.stringify(THEME_STORAGE_KEY));
    expect(THEME_INIT_SCRIPT).not.toContain("THEME_STORAGE_KEY");
  });
});
