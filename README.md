# Frontend Exercises

Daily React/TypeScript practice, generated automatically every morning and pushed here as a new dated folder.

## Format

Each day lives in its own folder at the repo root: `MM-DD-YYYY_ExerciseName/`

- **README.md** — the challenge, what's wrong with the code, the goal, and hints if you get stuck. It never names the underlying pattern or code smell outright — that's for you to find.
- **starter.ts** or **starter.tsx** — working code with a deliberate design problem embedded in it, written to look like real code rather than a toy example.
- **A test file** (`*.test.ts` / `*.test.tsx`) — tests that pass against the starter as-is, and that stay stable as you refactor. Construction and any compound return values are funneled through a small helper (a "seam") near the top of the file, so a refactor that changes the public API only requires updating that helper, not every test.
- Supporting config (`package.json`, `tsconfig.json`, `vitest.config.ts`, etc.) so the exercise runs standalone.

Exercises rotate across five categories: code review, debugging, architecture tradeoffs, TypeScript modeling, and React state/performance. Difficulty increases gradually over time, and adapts if a recent exercise was a struggle — it'll stay close to the same topic/difficulty rather than advancing, so it can be mastered before moving on.

## AI

There's no rule against using AI on these, but consider this a friendly guideline. The goal is to strengthen your own problem-solving muscles, and the best way to do that is by wrestling with the code yourself first. AI is great for comparing approaches or getting a second opinion once you've made your own attempt — but if you start with AI, you skip the practice that builds the instincts you rely on day to day.

## Running an exercise

Each dated folder is standalone. `cd` into it, install dependencies, and run the test file per the instructions in that folder's own README.
