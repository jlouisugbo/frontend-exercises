# Frontend Exercises — Generation Spec

This is the spec a scheduled Claude session follows to generate each daily exercise in this repo. If you (Joel) ever want to change how exercises are generated, edit this file — the scheduled task reads it fresh every run, so no other setup needs to change.

## Context

Daily React/TypeScript practice for someone with professional React/TS experience who wants to get stronger at frontend engineering — specifically: frontend system design/architecture, learned incrementally exercise by exercise, and depth in TypeScript as a language. Each weekday morning a new exercise shows up in this repo as a dated folder. Work through it on your own time. When you're ready, bring your attempt back to Claude (any session — chat, Cowork, whatever's handy) for a review: it'll read the exercise's README, your code, and `progress.jsonl`, then walk through your approach, what didn't land, an alternative, the concept behind it, and update `progress.jsonl` with what it saw.

## Category rotation

Rotate through these five **in strict round-robin order, advancing exactly one step every single time a new exercise is generated** — regardless of whether the previous exercise(s) have been attempted or reviewed yet:

1. Code review
2. Debugging
3. Architecture tradeoffs
4. TypeScript modeling
5. React state/performance

This is a hard rule with no exception: generation never waits on a review before moving to the next category. (Difficulty and pattern-repetition, below, are where "this one didn't land yet" actually gets handled — not by stalling the category rotation. The old behavior — holding the category because the prior exercise was still unreviewed — produced several days in a row of the same smell in different outfits, which is exactly what this spec now prevents.)

Vary the **domain** each time, independent of category (e-commerce, healthcare, logistics, finance, HR/payroll, sports, travel, education, social media, IoT, entertainment, gaming, real estate, insurance, telecom, manufacturing, fitness, etc.) so exercises feel like different real products, not one growing app. Don't repeat a domain used in the last several exercises if a fresh one is available.

## Pattern rotation (the "what this exercise is built around")

Each category has its own pool of recurring patterns, smells, or bug mechanisms — the kind of thing a strong engineer should be able to recognize and name on sight, the way the GoF patterns do for a general design-patterns course. Picking from a pool (instead of reinventing a fresh flaw from scratch each time) is what makes the exercises cumulative: over weeks, every pool gets fully cycled through, so the practice has actual breadth instead of circling the same idea in a different domain.

When generating an exercise: within that day's category, pick the **least-recently-used** pattern from its pool (the one that's gone longest without appearing, or has never appeared) — cycle the whole pool before any pattern repeats. Record which one you picked in `progress.jsonl`'s `pattern` field. Like the `flaw` field, this is for Claude's own future reference — **never name the pattern in the README**; the person should discover "oh, this is a Strategy-pattern gap" (or whichever) on their own, and Claude names it during review.

Pools (not exhaustive — add to a pool over time if a good new one comes to mind; this list should grow, never just get reused verbatim forever):

**Code review** (GoF-flavored structural smells):
- `strategy-pattern-gap` — the same type-conditional branching logic duplicated across multiple functions, crying out for one polymorphic/strategy-shaped seam instead
- `primitive-obsession` — a raw string/number standing in for a richer domain concept, so invalid values type-check fine
- `duplicated-business-rule` — the same rule reimplemented in more than one place, already caught drifting out of sync
- `god-function` — one function/class doing several unrelated jobs, hard to change one without risking the others
- `shotgun-surgery-coupling` — one conceptual change requires touching many unrelated call sites
- `boolean-parameter-trap` — `isX`/`isY` flags steering behavior instead of distinct types or a strategy
- `feature-envy` — a function reaching deep into another object's internals instead of asking that object to do the work
- `decorator-gap` — layered optional behaviors implemented as nested conditionals instead of composable wrappers
- `template-method-gap` — near-identical multi-step procedures copy-pasted with minor variations instead of one shared skeleton

**Architecture tradeoffs** (system-design-flavored):
- `query-command-separation` — a function that answers a question also commits a side effect, so there's no safe way to just check
- `broken-encapsulation` — internal mutable state exposed directly, so external code can bypass the class/module's own invariants
- `layering-violation` — UI code reaching straight into a data/service layer, skipping the abstraction meant to own that logic
- `concrete-dependency-coupling` — a module directly constructs/depends on one concrete implementation, blocking swaps or testing (Dependency Inversion gap)
- `facade-gap` — callers forced to orchestrate many low-level calls in the right order themselves, instead of one coherent entry point
- `observer-gap` — manual polling or ad hoc callback wiring where a subscribe/notify relationship is the natural fit, causing missed or duplicate updates
- `adapter-gap` — the codebase bends its own domain model to match a third-party/legacy shape inline, everywhere it's used, instead of isolating the translation once
- `module-boundary-leak` — a "public" API re-exports or exposes internal implementation details that callers come to depend on

**TypeScript modeling** (language-depth-flavored):
- `missing-discriminated-union` — a flat interface plus a string tag instead of a real union, with no exhaustiveness check on the type's consumers
- `unsafe-any-or-cast` — the type checker silenced with `any`/`as` instead of narrowing or modeling the actual shape
- `illegal-states-representable` — optional fields that are really mutually exclusive or co-required, so invalid combinations still compile
- `missing-generics` — a function/class hardcodes one concrete type where a generic would preserve type safety for every caller
- `weak-return-type` — a function's declared return type is wider than what it actually returns, so callers lose narrowing and re-check needlessly
- `branded-type-gap` — two different kinds of id (or other primitive-backed value) are both plain `string`/`number`, so they're accidentally interchangeable
- `builder-without-type-safety` — a fluent builder/options object where required combinations aren't enforced until runtime
- `mutable-shared-aliasing` — two parts of the code hold different type-narrowed views of the same mutable object, and a mutation through one silently invalidates an assumption baked into the other's type

**React state/performance**:
- `unstable-prop-defeats-memo` — a fresh inline function/object prop on every render defeats a memoized child
- `derived-state-duplicated` — a value computed from props/state is also stored in its own state, able to drift out of sync instead of being computed (or memoized)
- `context-overreach` — one broad context value re-renders everything subscribed to it on any change, instead of being split by what actually changes together
- `effect-does-too-much` — one effect bundles multiple unrelated concerns/dependencies, firing more often than any single concern needs
- `key-prop-misuse` — list rendering keyed on index or another unstable value, causing remounted/lost state or mismatched rows on reorder
- `controlled-uncontrolled-conflict` — a form input flips between controlled and uncontrolled depending on a value that can be `undefined`
- `stale-state-read` — code reads state right after setting it in the same handler, assuming it's already updated
- `over-memoization-overhead` — wrapping something in `useMemo`/`useCallback` where the comparison cost outweighs the recompute it avoids

**Debugging** (bug-mechanism-flavored, not GoF but same idea — a pool to cycle so it's never the same bug family for days):
- `stale-closure-async-race` — an async effect/callback with no guard against out-of-order resolution
- `missing-effect-cleanup` — an interval/listener/subscription an effect starts but never tears down
- `boundary-condition-bug` — an off-by-one or edge-of-range error
- `mutating-shared-reference` — two places hold the same object/array reference, and a "local" edit through one mutates the other's copy
- `event-listener-leak` — a handler re-registered on every render without removing the previous one
- `debounce-throttle-misfire` — a debounce/throttle implementation that fires too often or drops the final call
- `floating-point-drift` — money/percentage math using naive float arithmetic that accumulates error
- `incorrect-dependency-array` — an effect/memo dependency array that omits or wrongly includes a value, causing stale reads or an infinite loop

## Progression logic (read progress.jsonl first, every time)

- **Category**: always advance one step in the round-robin rotation from the last generated entry (see "Category rotation" above — this never stalls, no exceptions).
- **Pattern**: within that category, default to the least-recently-used pattern in its pool (see "Pattern rotation" above).
  - Exception: find that category's most recent entry that was **actually reviewed** — i.e. its `status` is `"completed"`, `"needs_revision"`, or `"struggled"`, not `"assigned"`. (Skip back over any `"assigned"`/unreviewed entries in that category to find it — an unreviewed exercise is not a verdict, just a pending one.) If that entry's status is `"needs_revision"` or `"struggled"`, **and** no later entry in that category has landed `"completed"`, hold: reuse that same pattern and the same difficulty (don't advance the pattern pool or raise difficulty), but still vary the domain. Otherwise — the most recent reviewed entry was `"completed"`, or the category has never been reviewed yet, or the most recent entry for it is still `"assigned"` — pick the next pattern in the pool normally.
  - Being `"assigned"` (not yet attempted/reviewed) is never itself a reason to hold. Only an actual review that came back negative holds things in place.
- **Difficulty** is 1–5, roughly:
  - **1–2**: the flaw is visible on a read-through; one dominant, obvious problem.
  - **3**: several related things need to change together; requires understanding *why*, not just spotting *what*.
  - **4–5**: real design tension — API boundaries, async correctness, or long-term extensibility are genuinely ambiguous until reasoned through.
  - Raise difficulty gradually across completed sessions on a given category+pattern pairing; don't jump straight to 4–5 the first time a pattern reappears.
- This runs unattended — there's no one to ask clarifying questions of. Don't propose an idea and wait for approval; just pick the category, pattern, domain, and difficulty per the rules above and write the files directly.

## What every exercise must be

- Solvable in about 30–40 minutes.
- Real-world shaped: code that looks like something written under deadline pressure, not a textbook example.
- One **primary** flaw tied to the session's category and chosen pattern — a code smell/design problem for code-review, architecture, or TypeScript-modeling exercises; a non-obvious bug for debugging exercises; a state-management or rendering-performance problem for React state/performance exercises — optionally 1–2 smaller independent flaws alongside it for realism (code-review/architecture/TS-modeling only), never so many they compete for attention.
- Silent about its own pattern. The README describes what the code does and why it's painful. It never names the smell, the GoF pattern, or the bug category being taught. That's for the person to discover, and for Claude to name later during review.
- Never shipped with a solution. The point is the attempt.

## File layout

Each exercise is a dated directory at the repo root: `MM-DD-YYYY_ExerciseName/` (PascalCase-ish exercise name), containing:

- **the name of the file based on the exercise** (`.tsx` if the exercise involves real React components/JSX) — the flawed starter code.
- **A test file** (`*.test.ts` / `*.test.tsx`, named for the exercise) using vitest (and React Testing Library + jsdom for component exercises) — see rules below.
- **README.md** — see template below.
- Minimal standalone config: `package.json`, `tsconfig.json`, `vitest.config.ts` (plus `vitest.setup.ts` if RTL/jsdom is needed). Model these on the most recent prior exercise's config files; otherwise use sensible minimal defaults.

### Test file rules

- Cover every conditional branch with at least one test.
- Tests must pass against the original, unrefactored starter code as written.
- **Extract a seam**: one or more small helper functions near the top of the file, before any test blocks, wrapping construction and/or the operation under test and any compound return-value access. Comment the seam clearly as expected to change during a refactor. Every test goes through the seam — never construct things or call the code under test directly inline elsewhere in the file.

### README template

```
# {Exercise Name}

{1-2 sentence intro / scenario}

## Setup

cd {folder}
npm install

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- [exercise-specific restrictions, if any]

## Running Tests

npm test

## The Challenge

[2-3 paragraphs: what the code does, why it's painful to extend or trust. Never names the smell/pattern/bug category. Include a concrete "breaking point" — a new requirement that motivates the refactor/fix.]

## Goals

- Make the code easier to maintain and extend long-term.
- [exercise-specific goal]
- [exercise-specific goal]

## Bonus Challenge

- [optional stretch goal]

## If you get stuck

- [hint that guides thinking without naming the pattern/bug]
- [hint]
- [hint]

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
```

## progress.jsonl

One JSON object per line, one line per exercise. Schema:

```
{
  "schema_version": 2,
  "date": "yyyy-mm-dd",
  "exercise": <sequential int>,
  "folder": "MM-DD-YYYY_ExerciseName",
  "title": "...",
  "category": "<one of the 5 rotation categories>",
  "pattern": "<the pattern/sub-topic from that category's pool this exercise is built around - Claude's own reference, never named in the README>",
  "domain": "...",
  "difficulty": <1-5>,
  "status": "assigned" | "completed" | "needs_revision" | "struggled",
  "flaw": "one-line description of the embedded smell/bug/problem — for Claude's own future reference, never shown to the person in the README",
  "key_learnings": [...],
  "mistakes": [...],
  "review_changes": [...],
  "next_focus": [...]
}
```

- `schema_version` is `2` as of the pattern-rotation change (older entries in this file are `1` and lack `pattern` — that's fine, don't backfill history, just use `2` going forward).
- When generating a new exercise: append a line with `status: "assigned"` and empty arrays for the review-only fields.
- When reviewing a submitted attempt (manual/on-demand, in any Claude session — not part of scheduled generation): update that exercise's line in place to `"completed"` (or `"needs_revision"`/`"struggled"` if it genuinely didn't land) and fill in the fields from the review.
- Always read the last several lines before picking the next category/pattern/difficulty — this file **is** the adaptive-difficulty state. Specifically: find the last entry to get the category rotation's current position, and scan back within each category for its most-recently-reviewed entry to resolve the pattern-hold exception above.
