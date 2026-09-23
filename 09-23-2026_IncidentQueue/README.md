# Incident Queue

**Category:** React state & performance  
**Difficulty:** 1/5  
**Target time:** 45–60 minutes

## AI

There is no rule against using AI, but the value of this exercise comes from forming your own diagnosis first. Read the component, predict when it renders, and identify which values are actual application state. Use AI afterward if you want another approach to compare against yours.

## Why this exercise exists

React components often become difficult to maintain because every useful value is placed in state and synchronized with effects. The interface may look correct while the component performs extra work, briefly renders old information, and spreads one user interaction across multiple updates.

This exercise asks you to preserve the behavior of a small production-style incident queue while improving how it represents state and computes its view.

## Setup

This directory is standalone. Use Node 20 or newer.

```bash
npm install
npm test
npm run typecheck
```

For watch mode:

```bash
npm run test:watch
```

## Scenario

An internal operations dashboard receives an updated `incidents` array whenever the backend pushes new data. Operators can search incidents, filter by status, change the ordering, and open one incident for details.

The current implementation works for the small fixture in the tests. However, it keeps both source inputs and several calculated results in React state. Effects then synchronize those values after rendering. The code was reasonable when the dashboard contained a few records, but the incident stream now changes frequently.

## The breaking point

The next release will display up to 2,000 incidents and may receive a new array every second. Product also wants the summary counts and visible rows to agree during every render so operators never see a count from one update beside rows from another.

Your refactor should make that scale-up safer without introducing a state-management library or changing the user-visible behavior.

## Your task

Refactor `starter.tsx` so that the component has a clear source of truth and avoids unnecessary synchronization work.

Your solution should:

1. Separate true interactive state from values that can be calculated from props and state.
2. Ensure the rows and summary describe the same snapshot during every render.
3. Avoid effect-driven state updates when no external system is being synchronized.
4. Keep filtering and sorting understandable as more rules are added.
5. Preserve the selected incident when filters temporarily hide its row.
6. Use memoization only where you can explain what work or rendering it prevents.
7. Keep the public component behavior and accessibility contract intact.

You may extract hooks or child components. The helper block near the top of `incident-queue.test.tsx` is the test seam to update if you intentionally change construction details.

## Restrictions

- Do not add Redux, Zustand, MobX, or another state-management package.
- Do not use `any`.
- Do not weaken or remove behavioral assertions.
- Do not synchronize calculated values with an effect.
- Do not mutate the `incidents` prop while sorting.
- Do not memoize every function or element automatically. Each optimization should have a reason.

## Acceptance criteria

- `npm test` passes.
- `npm run typecheck` passes under strict TypeScript settings.
- Search is case-insensitive and ignores surrounding whitespace.
- Status filtering and both sort modes retain their existing behavior.
- Summary counts always describe the full incident collection, not only the filtered rows.
- Selecting a row displays its current details.
- A selected incident remains selected when hidden by a filter and reappears when that filter is cleared.
- The component does not require an effect merely to derive rows or summary data.
- Props remain immutable.

## Suggested workflow

1. Run the tests before editing.
2. Mark every state value as either user input, external synchronization, or a calculation.
3. Draw the data dependencies for visible rows, summary counts, and the selected incident.
4. Remove one synchronization path at a time.
5. Run tests after each small change.
6. Use React DevTools Profiler or temporary render counters to compare the before and after behavior.
7. Remove any diagnostic logging before finishing.

## Questions to answer in your solution notes

- Which values must survive between renders, and which can be recalculated?
- What inconsistency can occur when related calculated values are updated in an effect?
- Which calculation, if any, is worth memoizing here?
- Would extracting a memoized row component help if every render creates a new callback? Why?
- When would `useDeferredValue` or `startTransition` become appropriate for search?
- What evidence would you collect before adding more performance optimizations?

## Bonus challenges

- Add a render-count experiment using React's `Profiler` and record the result before and after your refactor.
- Extract a reusable `useIncidentView` hook without coupling it to markup.
- Add a severity filter while keeping the filtering pipeline readable.
- Explore `useDeferredValue` with a much larger generated data set and explain whether it improves interaction responsiveness.
- Add a test proving that the component reflects updated details for the currently selected incident.

## If you get stuck

- Ask whether changing a value should cause a render, or whether the value is already available during render.
- Follow each effect backward and list every input used to produce its output.
- Two values calculated from the same inputs usually do not need separate synchronization lifecycles.
- An identifier is often more stable state than a copied domain object.
- `useMemo` is a performance tool, not a requirement for correctness.

## When you submit your answer

Share your commit, diff, or updated files. The review will give concise corrections and exactly one takeaway. It will evaluate correctness, state ownership, render consistency, accessibility, and whether each optimization earns its complexity.
