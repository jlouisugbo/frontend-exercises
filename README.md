# Frontend Exercises

A scratch space for repeating frontend exercises. Prompts and scaffolds get written here so you can generate code and practice against them.

Daily frontend engineering practice: one dated exercise folder per day, generated and pushed automatically each morning. Each folder rotates through five categories: code review, debugging, architecture tradeoffs, TypeScript modeling, and React state/performance. Difficulty ramps gradually as the week progresses.

## How to use

1. `cd` into the day's folder (`MM-DD-YYYY_ExerciseName/`).
2. `npm install`
3. Read the README, then dig into the starter code.
4. `npm test` -- all tests pass against the starter as given, and should still pass after your changes.
5. Paste your solution back to Claude (in this task, or any chat with Claude -- just point it at this repo) for corrections + a takeaway.
6. Reset and repeat until the pattern sticks.

## Structure

```
frontend-exercises/
  MM-DD-YYYY_ExerciseName/
    README.md          # the challenge, restrictions, goals, hints
    starter.ts          # the code to refactor/fix/extend
    <name>.test.ts       # tests that must keep passing
```

## Adaptive difficulty

`.progress.json` at the repo root tracks how each exercise went and drives what comes next -- it's the memory that lets a fresh session (the daily generator, or whatever session grades your solution) pick up where the last one left off. Its own `_fields` and `_generation_rules` keys document the schema and the rules in full; the short version:

* Struggled on the last one -> the next exercise stays in the same category and close to the same underlying concept, at the same or slightly lower difficulty, instead of moving on.
* Something's flagged `revisit: true` -> it gets brought back within the next couple of exercises before being considered done.
* Solid or mastered -> normal rotation resumes, difficulty ticks up slightly.

Whoever grades a solution (reviews it and gives feedback) is responsible for pulling latest, updating that day's entry in `.progress.json` (`outcome`, `notes`, `revisit`), and pushing -- that's what the next day's generation run reads.

## Automation

`.github/workflows/daily-exercise.yml` runs every morning (and can be triggered manually from the Actions tab) to generate the next exercise and commit it here automatically, using the adaptive rules above.
