export type RateLimitEntry = {
  /** Submission timestamps inside the current window, oldest first. */
  hits: number[];
};

export type RateLimitStore = Map<string, RateLimitEntry>;

export type RateLimitResult = {
  allowed: boolean;
  /** How many further submissions this key may make right now. */
  remaining: number;
};

/** A light, per-instance submission limiter.
 *
 *  `now` is a parameter rather than a call to `Date.now()` so the behaviour is
 *  testable without the wall clock and without faking timers.
 *
 *  This is not abuse protection. The store lives in one server instance's
 *  memory, is lost on restart or redeploy, and is not shared between instances.
 *  It raises the cost of a naive script and nothing more; do not describe it as
 *  anything stronger.
 *
 *  It is, however, bounded. Expired keys are dropped and `maxKeys` caps the rest,
 *  so a caller spoofing the header it is keyed on cannot grow it without limit.
 *  Weak and bounded are separate properties, and it needs to be both. */
export const DEFAULT_MAX_KEYS = 5_000;

/** Drops entries the window has left behind, then enforces the ceiling.
 *
 *  The first loop is the actual repair: the earlier version pruned timestamps
 *  inside an entry but never removed the entry, so a key seen once stayed in the
 *  map for the life of the process. The second is the backstop, because the key
 *  is a client-supplied header: a caller can mint a fresh one per request, and
 *  those are all still inside the window, so expiry alone never catches them.
 *
 *  Both are O(size), bounded by `maxKeys`, on a path that is already limited to
 *  a handful of calls per key per window. */
function sweep(
  store: RateLimitStore,
  now: number,
  windowMs: number,
  maxKeys: number,
): void {
  for (const [key, entry] of store) {
    const last = entry.hits[entry.hits.length - 1];
    if (last === undefined || now - last >= windowMs) {
      store.delete(key);
    }
  }

  /* Least-recently-touched first. Every write below re-inserts its key rather
     than updating it in place, so Map iteration order is recency order. */
  for (const key of store.keys()) {
    if (store.size <= maxKeys) {
      break;
    }
    store.delete(key);
  }
}

export function checkRateLimit(
  store: RateLimitStore,
  key: string,
  now: number,
  limit: number,
  windowMs: number,
  maxKeys: number = DEFAULT_MAX_KEYS,
): RateLimitResult {
  const entry = store.get(key);
  const fresh = (entry?.hits ?? []).filter((at) => now - at < windowMs);

  /* Deleted before every write so the re-insert moves this key to the end of the
     Map, which is what makes iteration order mean "least recently touched". */
  store.delete(key);

  if (fresh.length >= limit) {
    /* Write back the pruned list, but do not record this attempt. Counting a
       rejected call would let a caller hold their own block open forever. */
    store.set(key, { hits: fresh });
    sweep(store, now, windowMs, maxKeys);
    return { allowed: false, remaining: 0 };
  }

  store.set(key, { hits: [...fresh, now] });
  sweep(store, now, windowMs, maxKeys);
  return { allowed: true, remaining: limit - fresh.length - 1 };
}
