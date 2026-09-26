# Command Menu Shortcut

**Exercise #6 · Focus:** debugging  
**Difficulty:** 1/5  
**Target time:** 35–50 focused minutes

## Scenario

An internal React application includes a command menu that opens with Ctrl+K on Windows and Linux or Command+K on macOS. Teams embed the component on pages where administrators may enable or disable the shortcut without removing the component. The shortcut must not interfere with typing in editable controls, repeated keydown events, or the browser after the component unmounts.

The first release looked correct in manual testing: the menu opens, closes, respects its initial configuration, and removes its document listener when the page is left. A settings rollout revealed that changing the `enabled` prop while the page remains mounted does not reliably change shortcut behavior.

## Current behavior

Run the tests before editing. This is intentionally a debugging exercise, so the starter suite is not fully green:

- `stops handling the shortcut after enabled changes to false` is expected to fail because the shortcut still opens the menu after the prop changes.
- `starts handling the shortcut after enabled changes to true` is expected to fail because the shortcut remains inactive after the prop changes.

The other eight tests should pass. Together, these failures establish the task: behavior is correct on the initial render but disagrees with the component's current props after a rerender.

## The breaking point

The application is adding permission-aware navigation. A user's command-menu access can change after session refresh, without a full page reload. The current component can therefore expose a shortcut that the interface says is disabled or keep an authorized shortcut unavailable until refresh.

## Your task

Find the smallest production-quality correction in `starter.tsx`. Preserve the public component API and all behavior already covered by passing tests. Your explanation should trace which values are available when the document listener is registered, what happens after the prop changes, and what is removed during unmount.

Do not stop after making the two red tests green. Confirm that the implementation remains safe across repeated prop changes and cleanup. Keep the event-handling rules readable enough that another shortcut condition could be added later.

## Restrictions

- Do not use `any`, type assertions that bypass the event types, a global variable, or a state-management library.
- Do not remount the component with a changing `key` to hide the defect.
- Do not attach a new listener during render.
- Do not remove or weaken an assertion.
- Keep the Ctrl+K and Command+K behavior, editable-target guard, repeat guard, toggle behavior, and unmount cleanup.
- New dependencies are not needed.

## Acceptance criteria

- All 10 tests pass, and `npm run typecheck` passes in strict mode.
- The shortcut follows the latest `enabled` prop without requiring a remount.
- Ctrl+K and Command+K toggle the menu only when enabled.
- Shortcut events from an input or repeated keydown events are ignored.
- A handled shortcut prevents the browser default; an ignored shortcut does not.
- Unmounting leaves no active document shortcut behavior.
- Repeated enabled/disabled transitions do not accumulate document listeners or cause a single keypress to toggle more than once.

## Suggested workflow

1. Run the baseline tests and confirm exactly two failures.
2. Trace the initial render, effect setup, a prop-only rerender, and effect cleanup on paper.
3. Log function identity or current prop values temporarily if your mental model is uncertain.
4. Make one focused change, then run the full suite and typecheck.
5. Add one regression test for several enabled/disabled transitions before removing diagnostic logging.

## Questions to answer when you submit

- Why did initial manual testing pass while a prop update failed?
- Which render supplied the values used by the active document listener?
- What identity must cleanup remove?
- What tradeoff did you choose between reinstalling the listener and keeping one stable listener that reads current behavior?

## Bonus challenges

- Add a configurable shortcut key while keeping existing callers compatible.
- Support `contenteditable` descendants, not only an element that is itself editable.
- Render the component inside `StrictMode` and add a test proving one keypress causes one transition.
- Extract a narrowly reusable hook and explain why its API is not more generic.

## Non-spoiler hints

<details><summary>Hint 1</summary>

Write down the lifecycle of the exact function passed to `addEventListener`.

</details>

<details><summary>Hint 2</summary>

A function can be recreated with current props while an external system still holds an older function.

</details>

<details><summary>Hint 3</summary>

There are two reasonable families of fixes. One updates the external subscription when relevant behavior changes; the other keeps the subscription stable and routes it to current behavior. Either can be correct if setup and cleanup agree.

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

Share your branch or diff, the additional regression test, and brief answers to the four questions. The review will give concise corrections and exactly one memorable takeaway.
