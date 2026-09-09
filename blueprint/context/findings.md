# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-06 [P3] fixed - The fallback comment on /contact is contradicted by its own commit

**File:** src/app/contact/page.tsx:34
**Found:** 2026-09-09 by /audit (scope: current; lens: quality)
**Why it matters:** The comment states the fallback "renders only when an address
is supplied, which is not the case today: every value in `profile.links` is the
empty string." The same commit sets `email`, `github` and `linkedin` to real
values in src/content/profile.ts:33, and the served page at
http://localhost:3000/contact does render `mailto:info@mohamedhnoor.com`. A
comment that is actively wrong about the code beside it is worse than none, and
this one describes the feature's headline open risk as still open when the commit
closed it. The same claim is carried in the spec's "Carried forward" section.

**Suggested fix:** Cut the "which is not the case today" clause and the sentence
after it; the first line already says everything the reader needs. Update the
spec's Carried forward note in the same edit.
**Resolution:** Fixed in step 10. The `/contact` comment now states that an address is supplied and explains why the guard remains (an empty value must render nothing rather than a dead `mailto:`). The identical stale claim in `src/app/resume/page.tsx` was corrected in the same step; the reviewer cited one instance but it was one defect in two files. The spec's live-tense claim was rewritten to record that the fallback problem was resolved during the feature.

**Re-reviewed 2026-09-09 by /audit (independent; scope: current; lens: quality, security, performance, tests): not closed.** The two code comments are repaired and verified. `src/app/contact/page.tsx:34-38` and `src/app/resume/page.tsx:30-33` now describe the tree, and the running dev server confirms the behaviour they claim: `/contact` returns 200 and renders `mailto:info@mohamedhnoor.com`.

The spec half of the repair was not done, and this finding's own Suggested fix named it ("Update the spec's Carried forward note in the same edit"):

- `blueprint/context/current-feature.md:458-461` still reads "**The fallback still renders nothing.** `profile.links.email` is the empty string, so a visitor who hits the failure path has no way to make contact." The same delta sets `email: "info@mohamedhnoor.com"` at `src/content/profile.ts:33`, so the claim is false in the tree it ships with.
- `blueprint/context/current-feature.md:348-352` now contradicts itself inside one paragraph: "**Resolved during the feature:** a real address was supplied, and the fallback now renders. Until the user supplies a real address, a visitor who hits the fail-closed path has **no way to make contact at all**". The repair inserted the first sentence and left the second standing.

Step 10's done-when was "neither statement is contradicted by the tree", and one still is. The defect is the same one F-06 describes, a stale claim about the fallback, so this keeps its existing ID rather than gaining a new one. Stays `fixed`. P3, so it does not block `/complete`.

### F-07 [P2] open - Every visitor shares one rate-limit bucket when `x-forwarded-for` is absent or its first element is empty

**File:** src/actions/contact.ts:136
**Found:** 2026-09-09 by /audit (independent; scope: current; lens: security)
**Why it matters:** The limiter key is
`forwardedFor?.split(",")[0]?.trim() ?? "unknown"`. Two reachable inputs collapse
every caller into a single shared bucket, and the bucket is three submissions per
ten minutes:

- **Header absent** gives the literal key `"unknown"`. `headers().get()` returns
  `null` whenever nothing upstream sets `x-forwarded-for`: `npm run start` reached
  directly, a self-hosted container with no proxy in front, or any host whose
  proxy does not add the header. On such a deployment the limit stops being
  per-visitor and becomes **site-wide**: the fourth genuine enquiry from any
  visitor inside ten minutes is refused with "That is a few messages in a short
  time", and nothing is sent. That is a false positive on the one path the whole
  site exists to feed, and the visitor is told to try again later rather than
  that anything is wrong.
- **An empty first element** gives the key `""`. Reproduced: `""`,
  `", 203.0.113.9"` and `"  , 203.0.113.9"` all key on `""`. On an appending
  proxy, a client that sends `X-Forwarded-For:` with an empty value has the real
  address appended after it, so the leftmost element stays empty and the key is
  client-selectable. The practical impact is narrower than the case above, since
  an ordinary visitor's leftmost element is their real address, but it means the
  shared bucket can be filled deliberately.

This is not the spoofing concern from F-04, which was about a caller minting
*fresh* keys to evade the ceiling and which the spec accepts. This is the
opposite direction: distinct legitimate visitors being *merged* into one key and
blocked. The spec's Data / contracts does say the action "falls back to a
constant when absent", so the fallback is as designed, but the consequence of
that constant, a global rather than light limit, is not what the spec describes
the limiter as doing ("raises the cost of a script and nothing more").

`src/actions/contact.ts` has no test for key derivation at all: every case in
`tests/actions/contact.test.ts` sets a single well-formed address, so neither the
absent-header path nor the empty-element path is exercised.

**Suggested fix:** Treat an unusable key as "cannot identify this caller" rather
than as one shared identity. Either skip the limiter when no usable element is
present, which restores the documented "light" behaviour and fails open on the
conversion path, or pick the first **non-empty** element and skip when there is
none. Whichever is chosen, add tests for a missing header, an empty leftmost
element, and a normal appended chain, since none of those three is covered today.
**Resolution:**

### F-08 [P3] open - Source comments narrate the previous implementation and the review that replaced it

**File:** src/actions/contact.ts:44
**Found:** 2026-09-09 by /audit (independent; scope: current; lens: quality)
**Why it matters:** The repair commit added doc comments that describe code which
is no longer there, and the review history that removed it, in files a reader
will consult for current behaviour:

- `src/actions/contact.ts:44-58`, 15 lines on a 16-line function, covering
  "Keying it to `email` and `message` alone was wrong in a way that lost mail"
  and "The previous version used a literal U+0000 for that".
- `src/lib/links.ts:56-69`, "An earlier version enumerated the dangerous
  characters instead and missed the one that matters most".
- `src/lib/rate-limit.ts:29-38`, "The first loop is the actual repair: the
  earlier version pruned timestamps inside an entry but never removed the entry".
- Smaller instances at `src/actions/contact.ts:81-85` and
  `src/actions/contact.ts:105-110`.

`coding-standards.md` is explicit about this: "Keep doc comments minimal", a
comment "earns its place only when it captures something the code can't", and
"Over-commenting is a common AI tell, so resist it". The *decisions* here do earn
their place, and should stay: why the display name is quoted rather than filtered,
why a rejected call is not recorded, why `company` is excluded from the hash.
What does not is the before-and-after narration around them. It is a second,
unversioned copy of what git history and this ledger already hold, `/complete`
will archive these findings as `10/F-01` and so on, and nothing will keep the
comments in step once the next change lands.

This is a judgement call rather than a defect, and the surrounding codebase does
favour explanatory comments, so length alone is not the issue. What is new in this
delta is the past-tense narration of replaced code, which no comment at the base
commit does. The equivalent comments in the tests are appropriate and should
stay: a regression test should say which regression it guards.

**Suggested fix:** Keep the sentence that states the current decision and drop
the sentences describing what the code used to do. At `src/lib/rate-limit.ts:29`
that is roughly two lines instead of ten.
**Resolution:**
