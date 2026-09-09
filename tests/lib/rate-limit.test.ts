import { describe, expect, it } from "vitest";
import { checkRateLimit, type RateLimitStore } from "@/lib/rate-limit";

const LIMIT = 3;
const WINDOW = 10 * 60 * 1000;

const store = (): RateLimitStore => new Map();

describe("checkRateLimit", () => {
  it("allows the first three calls in a window and blocks the fourth", () => {
    const s = store();
    const results = [0, 1, 2, 3].map((i) =>
      checkRateLimit(s, "ip", 1_000 + i, LIMIT, WINDOW),
    );
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
  });

  it("reports how many submissions remain", () => {
    const s = store();
    expect(checkRateLimit(s, "ip", 0, LIMIT, WINDOW).remaining).toBe(2);
    expect(checkRateLimit(s, "ip", 1, LIMIT, WINDOW).remaining).toBe(1);
    expect(checkRateLimit(s, "ip", 2, LIMIT, WINDOW).remaining).toBe(0);
  });

  it("allows again once the window has elapsed", () => {
    const s = store();
    for (let i = 0; i < LIMIT; i++) checkRateLimit(s, "ip", 0, LIMIT, WINDOW);
    expect(checkRateLimit(s, "ip", WINDOW - 1, LIMIT, WINDOW).allowed).toBe(false);
    expect(checkRateLimit(s, "ip", WINDOW + 1, LIMIT, WINDOW).allowed).toBe(true);
  });

  it("keeps keys independent", () => {
    const s = store();
    for (let i = 0; i < LIMIT; i++) checkRateLimit(s, "a", 0, LIMIT, WINDOW);
    expect(checkRateLimit(s, "a", 0, LIMIT, WINDOW).allowed).toBe(false);
    expect(checkRateLimit(s, "b", 0, LIMIT, WINDOW).allowed).toBe(true);
  });

  /* A rejected call must not record a hit. If it did, a caller hammering the
     endpoint would hold their own block open indefinitely. */
  it("does not extend the block by counting rejected calls", () => {
    const s = store();
    for (let i = 0; i < LIMIT; i++) checkRateLimit(s, "ip", 0, LIMIT, WINDOW);
    for (let t = 1; t < WINDOW; t += 1000) {
      checkRateLimit(s, "ip", t, LIMIT, WINDOW);
    }
    expect(checkRateLimit(s, "ip", WINDOW + 1, LIMIT, WINDOW).allowed).toBe(true);
  });

  it("prunes timestamps that fell out of the window", () => {
    const s = store();
    checkRateLimit(s, "ip", 0, LIMIT, WINDOW);
    checkRateLimit(s, "ip", WINDOW + 1, LIMIT, WINDOW);
    expect(s.get("ip")?.hits).toEqual([WINDOW + 1]);
  });
});

/* The store used to prune timestamps inside an entry but never remove the entry,
   so a key seen once stayed for the life of the process. Nothing bounded it. */
describe("checkRateLimit store growth", () => {
  it("forgets a key entirely once its window has elapsed", () => {
    const s = store();
    checkRateLimit(s, "gone", 0, LIMIT, WINDOW);
    expect(s.has("gone")).toBe(true);

    checkRateLimit(s, "other", WINDOW + 1, LIMIT, WINDOW);
    expect(s.has("gone")).toBe(false);
  });

  it("forgets a blocked key once its window has elapsed", () => {
    const s = store();
    for (let i = 0; i < LIMIT + 1; i++) {
      checkRateLimit(s, "blocked", 0, LIMIT, WINDOW);
    }
    checkRateLimit(s, "other", WINDOW + 1, LIMIT, WINDOW);
    expect(s.has("blocked")).toBe(false);
  });

  /* The key is the first entry of `x-forwarded-for`, which the client controls,
     so a caller can mint a fresh one per request. Those are all inside the
     window, so expiry alone never reclaims them and only the cap does. */
  it("never grows past the cap, even with a fresh key every call", () => {
    const s = store();
    const MAX = 10;
    for (let i = 0; i < 500; i++) {
      checkRateLimit(s, `spoofed-${i}`, 1_000, LIMIT, WINDOW, MAX);
      expect(s.size).toBeLessThanOrEqual(MAX);
    }
    expect(s.size).toBe(MAX);
  });

  it("evicts the least recently touched key when it hits the cap", () => {
    const s = store();
    const MAX = 3;
    checkRateLimit(s, "a", 0, LIMIT, WINDOW, MAX);
    checkRateLimit(s, "b", 1, LIMIT, WINDOW, MAX);
    checkRateLimit(s, "c", 2, LIMIT, WINDOW, MAX);

    /* Touching `a` again must move it to the back of the queue, otherwise
       eviction order is insertion order and an active caller gets dropped
       before an idle one. */
    checkRateLimit(s, "a", 3, LIMIT, WINDOW, MAX);
    checkRateLimit(s, "d", 4, LIMIT, WINDOW, MAX);

    expect(s.has("b")).toBe(false);
    expect(s.has("a")).toBe(true);
    expect(s.has("c")).toBe(true);
    expect(s.has("d")).toBe(true);
  });

  it("still counts correctly for a key that survives a sweep", () => {
    const s = store();
    checkRateLimit(s, "ip", 0, LIMIT, WINDOW);
    checkRateLimit(s, "noise", 1, LIMIT, WINDOW);
    checkRateLimit(s, "ip", 2, LIMIT, WINDOW);
    expect(checkRateLimit(s, "ip", 3, LIMIT, WINDOW).allowed).toBe(true);
    expect(checkRateLimit(s, "ip", 4, LIMIT, WINDOW).allowed).toBe(false);
  });
});
