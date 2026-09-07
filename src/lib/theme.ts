export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "theme";

export const DEFAULT_THEME: Theme = "dark";

/** Anything that is not an explicit "light" resolves to the dark default: a
 *  missing key, a value written by something else, unreadable storage.
 *
 *  Must stay self-contained with literals only. It is serialized into the
 *  pre-paint script below, so a reference to anything outside this function
 *  would be undefined by the time the script runs. */
export function resolveTheme(stored: string | null | undefined): Theme {
  return stored === "light" ? "light" : "dark";
}

/* Runs during HTML parsing, before paint and before React, so a stored light
   preference never flashes dark. Serializing resolveTheme keeps one definition
   of the rule instead of restating it in an inline string. The try/catch
   matters: storage throws outright in some privacy modes, and the server
   already rendered the dark default, so swallowing the error lands correctly. */
export const THEME_INIT_SCRIPT = `(function(){try{var resolve=${resolveTheme.toString()};document.documentElement.classList.toggle("dark",resolve(localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)}))==="dark")}catch(e){}})();`;
