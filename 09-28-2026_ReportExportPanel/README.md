# Report Export Panel

**Exercise #8 · Focus:** React state/performance  
**Difficulty:** 1/5  
**Target time:** 40–55 focused minutes

## Scenario

An analytics dashboard lets users export a report as CSV or PDF. The injected `createExport` function models the backend request and returns a download URL. While the request is pending, the controls are disabled and an accessible status message is shown. A success displays the correct download link; a failure displays an alert and allows retry.

The component behaves correctly today and every supplied test passes. Its request lifecycle is represented by several state values that are updated separately across the format-change and submit handlers. Each render has to infer the current phase by combining those values.

## Current pain

The code can independently represent `isExporting`, `downloadUrl`, and `errorMessage`, even though several combinations have no useful product meaning. A maintainer must inspect every setter to understand whether a render can show progress, an old link, and an error together. Adding a new request outcome means coordinating more assignments across success, failure, retry, and format changes.

This is a refactoring exercise. Preserve observable behavior while making the allowed request phases and transitions easier to understand and harder to misuse.

## The breaking point

Product plans to add cancellation and expiring download links. A cancelled request must not look like a failure, and an expired success must return to a state from which the user can export again. The team wants those additions to be localized rather than requiring another boolean and more clearing logic in every handler.

Do not implement cancellation or expiration in the required work. Refactor today's behavior so those future transitions have an obvious home.

## Your task

Refactor `starter.tsx` so each render has one coherent export phase and only the data valid for that phase. Keep the selected file format as user-controlled input. Preserve the public component API, injected async boundary, accessible output, request arguments, and all current behavior.

The required change should remain appropriately small. You may extract private types, transition logic, or a focused hook when it improves clarity, but do not introduce an application-wide state library or a generic workflow framework.

The helper block near the top of `report-export.test.tsx` is the intended seam if you change construction details without changing behavior.

## Restrictions

- Do not use `any`, non-null assertions, or type casts to claim request data exists.
- Do not weaken, delete, or rewrite assertions around observable behavior.
- Do not add Redux, Zustand, XState, or another state package.
- Do not store JSX elements in state.
- Do not use an effect merely to synchronize one state value with another.
- Keep the format selector controlled and disabled while exporting.
- Keep errors user-safe; do not render the thrown error's raw message.
- Do not implement the bonus cancellation or expiration requirements as part of the required refactor.

## Acceptance criteria

- All 8 tests pass and `npm run typecheck` passes in strict mode.
- The initial, pending, successful, and failed phases preserve their current accessible UI.
- Only a successful phase carries a download URL; only a failed phase carries the user-facing error.
- Starting or retrying an export immediately removes stale success or failure output.
- Changing format after success or failure returns the request feedback to its initial state.
- Request success and failure cannot produce a render that also claims the same request is pending.
- Valid transitions are explicit enough that cancellation could be added without editing unrelated render branches.
- State updates remain immutable, and no effect is used to mirror calculated request state.

## Suggested workflow

1. Run the baseline tests and typecheck before editing.
2. List the meaningful request phases and the data that belongs to each one.
3. Trace transitions caused by submit, resolve, reject, retry, and format change.
4. Refactor the representation before changing the markup.
5. Render each phase from the new representation and rerun the suite.
6. Add one focused test proving that changing format after an error clears the alert.
7. Explain how cancellation would fit your transitions without implementing it.

## Questions to answer when you submit

- Which state belongs to user input, and which state describes the request lifecycle?
- Which combinations from the starter were representable but not meaningful?
- Where is each allowed transition defined in your refactor?
- Why did you choose your state-update approach instead of the closest alternative?
- Would memoization improve this component today? What evidence would justify it later?

## Bonus challenges

- Add cancellation using an injected function or `AbortSignal`, with deterministic tests.
- Add an expiring-success event driven by an injected clock rather than arbitrary test sleeps.
- Extract a reusable hook without coupling it to this component's labels or markup.
- Test the component inside `StrictMode` and document which guarantees still hold.

## Non-spoiler hints

<details><summary>Hint 1</summary>

Write down the complete data needed by each request phase. Some phases need no extra data, while others need exactly one payload.

</details>

<details><summary>Hint 2</summary>

If rendering one branch should prove that a value exists, consider whether the type system can carry that proof.

</details>

<details><summary>Hint 3</summary>

The format selection and the request result change for different reasons. They do not necessarily need the same lifecycle.

</details>

<details><summary>Hint 4</summary>

You can centralize transitions without building a large abstraction. Choose the smallest approach that keeps event-to-state changes easy to trace.

</details>

## Setup and run commands

Use Node 20 or newer. From inside this dated directory:

```bash
npm ci
npm test
npm run typecheck
```

For watch mode:

```bash
npm run test:watch
```

## Submission

Share your branch or diff, the additional format-after-error test, and brief answers to the five questions. The review will give concise corrections and exactly one memorable takeaway.
