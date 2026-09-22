# Notification Center

**Focus:** TypeScript modeling  
**Difficulty:** 1/5  
**Target time:** 35–45 minutes

## Why this exercise exists

The notification pipeline in `starter.ts` receives loosely typed API data and turns it into rows for a product notification center. The code works, and the tests describe behavior that users already depend on. The problem is that the meaning of several fields changes according to `kind`, while TypeScript treats nearly every combination as valid.

This is a refactoring exercise. Preserve observable behavior while making the model safer and the implementation easier to extend. You should be able to explain which invalid states your design prevents and where untrusted API data becomes trusted application data.

## Setup

This directory is standalone.

```bash
npm install
npm test
npm run typecheck
```

Use Node 20 or newer.

## Scenario

The current API sends four notification kinds:

- `message`: requires a sender name and opens a conversation.
- `mention`: requires a sender name and opens the mentioned resource.
- `system`: has no sender and may be urgent.
- `promotion`: may expire and may have a call to action.

`buildNotificationRows` currently accepts one broad interface full of optional fields. It also uses string comparisons throughout the transformation. A caller can therefore create values such as a message without a sender, a system alert with a conversation ID, or a promotion with a sender. The compiler accepts all of them.

## The breaking point

Product wants to add `security_alert` next week. It must include a device name and occurrence time, must always be urgent, and must never contain a promotional call to action. The team is worried that adding another branch will make the existing function harder to reason about and easier to misuse.

Do not implement `security_alert` in the required portion. Refactor the existing design so that adding it later would be localized and compiler-guided.

## Your task

Refactor `starter.ts` while keeping every existing test green.

Your solution should:

1. Give each supported notification kind a precise TypeScript shape.
2. Prevent fields that belong to one kind from silently appearing on another kind.
3. Keep parsing or validation of raw API input separate from rendering decisions.
4. Make exhaustive handling visible to the compiler.
5. Avoid type assertions that merely silence errors.
6. Avoid changing the expected output contract unless you update the test seam while preserving its meaning.

You may change exported types and function signatures. The helper block at the top of `notification.test.ts` is the intended seam for adapting tests to a cleaner public API.

## Restrictions

- Do not use `any`.
- Do not use `as unknown as ...` or non-null assertions to bypass modeling problems.
- Do not delete or weaken a behavioral assertion.
- Do not add a default branch that silently accepts a new notification kind.
- Keep all timestamps as ISO strings at the external boundary.

## Acceptance criteria

- `npm test` passes.
- `npm run typecheck` passes in strict mode.
- Existing ordering, labels, urgency, destination, and expiration behavior remain intact.
- Adding a new internal notification variant produces useful compiler errors in every place that must handle it.
- Invalid internal combinations are rejected by TypeScript.
- The boundary for malformed or unknown API input is explicit.

## Suggested workflow

1. Read the implementation without editing it.
2. Identify fields whose requiredness changes by `kind`.
3. Decide which type represents untrusted transport data and which type represents trusted application data.
4. Refactor one notification kind at a time.
5. Run tests after each small change.
6. Temporarily add an invalid object and confirm that TypeScript rejects it.
7. Describe how you would add `security_alert` after the refactor.

## Questions to answer in your solution notes

- Where does runtime validation belong, and why?
- Which invalid states can no longer compile?
- How does the compiler prove that every kind is handled?
- Would you expose one transformation function or separate behavior by kind? What tradeoff did you choose?
- What would change if notification kinds were configured by the server instead of being known at build time?

## Bonus challenges

- Add a safe parser that returns a result type instead of throwing for malformed input.
- Add `security_alert` and show that the compiler identifies every required update.
- Create type-level tests using `// @ts-expect-error` for invalid combinations.
- Replace the current date parameter with a small clock dependency and explain when that abstraction is worthwhile.

## If you get stuck

- Group fields by when they are valid rather than by their primitive TypeScript type.
- Ask whether a single interface with many optional properties communicates the domain rules.
- Look for a way to make the `kind` field narrow the rest of the object.
- Make the impossible case reach a function that accepts `never`.
- Keep the raw network shape broad if necessary, then convert it once at the boundary.

## When you submit your answer

Share your refactored file or commit. The review should give concise corrections and one takeaway. It should judge behavior, strict TypeScript safety, extensibility, and whether the design is appropriately sized for this problem.
