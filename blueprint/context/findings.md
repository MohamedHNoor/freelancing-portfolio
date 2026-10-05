# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

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

**Re-reviewed 2026-10-05 by /audit (independent; scope: current; d9304aa..c3db156): still open.** `src/actions/contact.ts` is in this delta (new fields, honeypot rename, labelled email body), but the limiter key is unchanged and now sits at line 147: `forwardedFor?.split(",")[0]?.trim() ?? "unknown"`. `tests/actions/contact.test.ts` still sets one well-formed address per test, so neither the absent-header nor the empty-element path is exercised. P2, does not block `/complete`.

**Re-reviewed 2026-10-05 by /audit (independent; scope: current; lens: quality, security, performance, tests; d9304aa..ee226e0): still open.** The repair checkpoint did not touch the limiter. `src/actions/contact.ts:146-147` still keys on `forwardedFor?.split(",")[0]?.trim() ?? "unknown"`, and `tests/actions/contact.test.ts` never sets `forwardedFor` to `null` or to a value with an empty first element (every assignment is a well-formed address from `freshIp()` or a fixed IP). P2, does not block `/complete`.

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

**Re-reviewed 2026-10-05 by /audit (independent; scope: current; d9304aa..c3db156): still open.** This delta rewrote the honeypot comment at `src/actions/contact.ts:116-121` from past-tense narration into a present-tense rule, which is the shape this finding asks for. The other cited narration remains: `src/actions/contact.ts:47-61` ("Keying it to `email` and `message` alone was wrong", "The previous version used a literal U+0000") and `src/lib/links.ts:58-59` ("An earlier version enumerated the dangerous characters"). `src/lib/rate-limit.ts` is untouched by this delta and was not re-read for closure. The delta also adds two small instances of the same pattern: `src/lib/validation/contact.ts:151` ("It was `company` until that became a real field.") and the header of `src/content/projects.ts:7-12`, which narrates how TravelGrid's figures used to differ. P3, does not block `/complete`.

**Re-reviewed 2026-10-05 by /audit (independent; scope: current; lens: quality, security, performance, tests; d9304aa..ee226e0): still open.** Unchanged by the repair checkpoint. The narration is still at `src/actions/contact.ts:47-61`, `src/lib/links.ts:58-63`, `src/lib/rate-limit.ts:31-33` and `src/lib/validation/contact.ts:151`. The repair's own new comments (the honeypot `data-*` hints in `ContactForm.tsx:265-267`, `PointGrid`'s `reveal` prop, `BACKGROUND_LINKS`) state current behaviour and add no new instance. P3, does not block `/complete`.

### F-14 [P2] open - /resume still describes the replaced three-track positioning in its search and social descriptions

**File:** src/app/resume/page.tsx:20
**Found:** 2026-10-05 by /audit (independent; scope: current; lens: quality)
**Why it matters:** The fix exists to replace the three narrow tracks, and its SEO
bullet calls for "the brief's titles and descriptions". `/resume`'s `description`
still reads "Experience, stack and selected work for a freelance software engineer
building white-label sites for agencies, SaaS products for startups, and Figma to
Next.js sites." `routeMetadata` copies it into Open Graph and Twitter, so the
prerendered `resume.html` carries the old positioning in its `description`,
`og:description` and `twitter:description` meta tags, and again in the embedded
page payload. The same file is in this delta (its
subtitle moved from the headline to `profile.role`), so the page was touched and
this line was missed. It is the snippet a search result or a LinkedIn share of the
resume shows, which is the start of the conversion path the fix is built around.
F-12 corrected the leftovers it named; this one was not among them. A sweep of the
built HTML finds no other instance: the remaining "white-label" on `/` is the
Agencies audience card, as the spec intends.
**Suggested fix:** Rewrite the description in the new positioning, for example
"Resume of Mohamed Noor, a full-stack web developer in Wellington, New Zealand:
experience, technology and selected work." No code change beyond the string.
**Resolution:**

### F-15 [P3] open - The "seven steps" ordered list on /process announces eight items, the eighth being the call to action

**File:** src/components/primitives/PointGrid.tsx:57
**Found:** 2026-10-05 by /audit (independent; scope: current; lens: quality)
**Why it matters:** `PointGrid` renders `trailing` as one more `<li>` inside the
same list. On `/process` that list is the numbered `<ol>` of steps, labelled by
the `sr-only` heading "The seven steps" (`src/app/process/page.tsx:38-48`). The
prerendered `/process` has 8 `<li>` in that `<ol>`, so a screen reader announces
"list, 8 items" under a heading that says seven, and reads the Start a Project
card as item 8 of the process. `PointCard`'s own comment
(`PointGrid.tsx:67`, "Decorative: an `ol` already announces position") relies on
the list position being the step number, which the trailing item breaks. Sighted
users see 01 to 07 and an unnumbered card, so the two audiences get different
structures. Not a WCAG A or AA failure, which is why an axe run would not flag it,
but `coding-standards.md` treats accessibility semantics on this site as a
product claim. On `/`, `Reasons` uses an unordered list, where the extra item is
harmless.
**Suggested fix:** Keep the trailing cell out of the list: render the list and
the trailing cell as siblings inside one grid wrapper (the `ol` as
`display: contents`, or a wrapping `div` that owns the grid), or accept
`trailing` only when `numbered` is false. The visual layout stays the same.
**Resolution:**

### F-16 [P3] open - The one-business-day reply promise is hard-coded in five places, and its comment says to change it "in both places"

**File:** src/components/sections/FinalCta.tsx:12
**Found:** 2026-10-05 by /audit (independent; scope: current; lens: quality)
**Why it matters:** `FinalCta` says "The reply time is a commitment, not a
flourish, and it is repeated on `/contact`. If it stops being true, change it in
both places first." This delta spreads the same commitment to five strings in
four files: `src/app/contact/page.tsx:11` (metadata) and `:29` (lead),
`src/components/sections/FinalCta.tsx:23`, `src/components/primitives/StartProjectCard.tsx:18`
and `src/components/projects/CaseStudyCta.tsx:28`. A maintainer who follows the
comment updates two and leaves three public pages promising a reply time the
business no longer keeps. The project's own rule is that a promise on this site
must stay literally true.
**Suggested fix:** Hold the reply time once in the content layer (for example
`profile.replyTime`, or a constant beside `PRIMARY_CTA`) and interpolate it in all
five strings, then drop the "both places" instruction. Or, at minimum, correct the
comment to name every location.
**Resolution:**

### F-17 [P3] unverified - Copy in four places reads as a claim of existing clients across New Zealand, Australia and internationally

**File:** src/components/sections/Location.tsx:15
**Found:** 2026-10-05 by /audit (independent; scope: current; lens: quality)
**Why it matters:** `blueprint/project-plan.md:63-65` says "the site never implies
existing clients in any country", and the code says the same:
`Location.tsx:3-5` ("without implying clients in any country: it says where the
work can be, not where it has been") and `src/content/profile.ts:57` ("never a
claim about where past clients were"). The rendered copy reads the other way:
`Location.tsx:15` "I'm based in Wellington and work with businesses, startups and
agencies across New Zealand, Australia and internationally",
`src/content/approach.ts:28` "working with clients across New Zealand, Australia
and internationally", `src/app/about/page.tsx:21` "working with businesses,
startups and agencies across...", and the `/about` label "Working with clients
in" (`src/components/detail/AboutDetail.tsx:47`). Present-tense "work with ...
across" is most naturally read as a description of a current client base. This
reviewer cannot tell whether that is true, and the wording comes from the owner's
brief, so this is a lead rather than a confirmed defect: either the copy or the
plan's rule and the two comments are wrong, and only the owner can say which.
**Suggested fix:** If there are no clients in Australia or abroad yet, reword to
availability ("available to businesses, startups and agencies across New
Zealand, Australia and internationally"; label "Available to clients in"). If
there are, amend the project plan's rule and the two comments so they match.
**Resolution:**
