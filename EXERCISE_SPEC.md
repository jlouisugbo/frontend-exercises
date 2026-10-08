# Frontend Exercises — Generation Spec

This is the spec a scheduled Claude session follows to generate each daily exercise in this repo. If you (Joel) ever want to change how exercises are generated, edit this file — the scheduled task reads it fresh every run, so no other setup needs to change.

## Context

Daily React/TypeScript practice for someone with professional React/TS experience who wants to get stronger at frontend engineering. Each weekday morning a new exercise shows up in this repo as a dated folder. Work through it on your own time. When you're ready, bring your attempt back to Claude (any session — chat, Cowork, whatever's handy) for a review: it'll read the exercise's README, your code, and `progress.jsonl`, then walk through your approach, what didn't land, an alternative, the concept behind it, and update `progress.jsonl` with what it saw.

## Category rotation

Rotate through these five, adapting to `progress.jsonl` rather than following it rigidly:

1. Code review
2. Debugging
3. Architecture tradeoffs
4. TypeScript modeling
5. React state/performance

Vary the **domain** each time, independent of category (e-commerce, healthcare, logistics, finance, HR/payroll, sports, travel, education, social media, IoT, entertainment, gaming, real estate, etc.) so exercises feel like different real products, not one growing app.

## Progression logic (read progress.jsonl first, every time)

- Default: advance one step in the category rotation from the last entry.
- If the last entry's `status` is `"struggled"` or `"needs_revision"`: stay on the same category — and ideally the same sub-topic within it (e.g. the same kind of async/effect bug, not just "debugging" in general) — for the next session instead of advancing, and hold difficulty rather than raising it. Don't advance again until a category lands as `"completed"`.
- Difficulty is 1–5, roughly:
  - **1–2**: the flaw is visible on a read-through; one dominant, obvious problem.
  - **3**: several related things need to change together; requires understanding *why*, not just spotting *what*.
  - **4–5**: real design tension — API boundaries, async correctness, or long-term extensibility are genuinely ambiguous until reasoned through.
  - Raise difficulty gradually across completed sessions on a category; don't jump straight to 4–5 the first time a category reappears.
- This runs unattended — there's no one to ask clarifying questions of. Don't propose an idea and wait for approval; just pick the category, domain, and difficulty per the rules above and write the files directly.

## What every exercise must be

- Solvable in about 30–40 minutes.
- Real-world shaped: code that looks like something written under deadline pressure, not a textbook example.
- One **primary** flaw tied to the session's category — a code smell/design problem for code-review, architecture, or TypeScript-modeling exercises; a non-obvious bug (logic error, stale closure, race condition, off-by-one, effect-dependency bug, etc.) for debugging exercises; a state-management or rendering-performance problem for React state/performance exercises — optionally 1–2 smaller independent flaws alongside it for realism (code-review/architecture/TS-modeling only), never so many they compete for attention.
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

Don't look for a solution here — there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
```

## progress.jsonl

One JSON object per line, one line per exercise. Schema:

```
{
  "schema_version": 1,
  "date": "yyyy-mm-dd",
  "exercise": <sequential int>,
  "folder": "MM-DD-YYYY_ExerciseName",
  "title": "...",
  "category": "<one of the 5 rotation categories>",
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

- When generating a new exercise: append a line with `status: "assigned"` and empty arrays for the review-only fields.
- When reviewing a submitted attempt (manual/on-demand, in any Claude session — not part of scheduled generation): update that exercise's line in place to `"completed"` (or `"needs_revision"`/`"struggled"` if it genuinely didn't land) and fill in the fields from the review.
- Always read the last few lines before picking the next category/difficulty — this file **is** the adaptive-difficulty state.
