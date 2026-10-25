# Field Alert Triage

AgriPulse's field-alert feed shows growers a live stream of problems their sensors and scouting reports turn up: a field drying out, a frost warning for the night ahead, a pest sighting that needs a follow-up. Two places turn a raw alert into something human-facing - the feed itself, and the dispatch queue that decides who gets paged first.

## Setup

```
cd 10-25-2026_FieldAlertTriage
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `formatAlertHeadline` and `getAlertPriority` exported under those names with their current signatures (`(alert: FieldAlert) => string` and `(alert: FieldAlert) => number`) - the ops dashboard and the on-call rotation tooling both already import them by name. You're free to change `FieldAlert`'s shape and anything about how each function is implemented internally.

## Running Tests

```
npm test
```

## The Challenge

Right now every alert AgriPulse generates - low moisture, frost risk, or a pest sighting - is represented by one `FieldAlert` interface with a `kind` string and a pile of optional fields, one cluster per kind. `formatAlertHeadline` (read by the ops dashboard) and `getAlertPriority` (read by the on-call rotation) each have their own hand-written if/else chain over `alert.kind`, each reaching into whichever optional fields happen to matter for that branch, and each ending in a catch-all branch for anything they don't recognize.

That works as long as the two chains stay in sync, but nothing actually keeps them in sync. Nothing stops someone from building a `FieldAlert` with `pestSpecies` set on a `'low-moisture'` alert, or from typing `'low-moistures'` by mistake - it'll just quietly land in the catch-all in both functions, with no warning from anywhere. And when a new alert kind shows up, a developer has to remember, on their own, to go update both chains by hand.

Ops wants to add a fourth kind, `'equipment-fault'`, for a soil sensor whose battery is dying or whose feed has gone stale, with its own severity-driven priority. Add it to `formatAlertHeadline` but forget `getAlertPriority` (or the reverse), and nothing complains - equipment-fault alerts just quietly inherit whatever the catch-all branch does, and nobody finds out until a fault sits unworked for a week because it never got paged with real urgency.

## Goals

- Make the code easier to maintain and extend long-term.
- Make forgetting to handle a new alert kind somewhere a compile error, not a silent fallback.
- Make it impossible to construct a `FieldAlert` that carries fields from a kind it isn't.

## Bonus Challenge

- Add the `'equipment-fault'` kind yourself (battery level or feed staleness driving the severity - your call) and confirm the compiler forces you to handle it everywhere it needs to be handled.

## If you get stuck

- What would change if `alert.kind` were a union of string literals instead of `string`, and each catch-all branch were replaced with something that only compiles once every other case has been handled?
- Look at which optional fields `formatAlertHeadline` actually reads together in each branch. Is there a shape where those fields aren't optional at all - just scoped to the one branch that needs them?
- TypeScript can make an "impossible" branch actually impossible to reach without the compiler noticing, instead of just returning a default.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
