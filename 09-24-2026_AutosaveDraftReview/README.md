# Autosave Draft Review

**Category:** Code review  
**Difficulty:** 1/5  
**Target time:** 45–60 minutes

## AI

Do the first review pass without AI. The point is to practice deciding whether a change is safe to merge, which requires forming your own model of the code and its failure modes. After you submit your review, AI can be useful for comparing priorities and checking whether your proposed fixes address the actual risk.

## Setup

This exercise is standalone. Use Node 20 or newer.

```bash
npm install
npm test
npm run typecheck
```

For watch mode:

```bash
npm run test:watch
```

## Pull request context

An editor team has introduced `useAutosaveDraft`, a hook that waits for the user to pause typing and then saves the newest draft through an injected async function. The hook exposes a status and the latest revision reported by the server so the editor can display feedback such as “Saving…” or “Saved.”

The author says the hook is ready for reuse across the document editor. The included tests pass and TypeScript is strict. You are the reviewer responsible for deciding whether this PR is safe to merge.

Assume the following production conditions:

- Editors may move quickly between documents.
- Network requests can succeed, fail, or finish in a different order than they started.
- A document body is allowed to contain any string value.
- The parent component may pass a newly created `saveDraft` function during a render.
- Components can unmount while work is pending.
- React Strict Mode is enabled in development.

Do not assume every condition above necessarily creates a defect. Trace the implementation and prove the impact before commenting.

## The breaking point

The hook is about to move from an internal prototype into a shared editor package. Once merged, multiple editor surfaces will depend on its contract, and changing its behavior will require coordination across teams.

Your review should focus on risks worth addressing before that contract spreads.

## Your task

### Phase 1: Review

Read `starter.ts` and `autosave-draft.test.ts`. Produce a `REVIEW.md` containing only comments you would genuinely leave on the pull request.

For every comment, include:

```text
Severity: BLOCKER | NON-BLOCKING | QUESTION | NIT
Location: file and relevant line or expression
Comment: concise explanation
Impact: concrete user or system consequence
Fix direction: the smallest appropriate direction, not a full rewrite
Evidence: a scenario or test that demonstrates the concern
```

Use the severities consistently:

- `BLOCKER`: the PR is unsafe to merge without addressing it.
- `NON-BLOCKING`: a real improvement that may reasonably follow after merge.
- `QUESTION`: missing context prevents a confident judgment.
- `NIT`: a minor preference with negligible impact.

The strongest submission may contain fewer comments. Prioritize correctness, async behavior, lifecycle safety, API contract, and the quality of the tests. Do not criticize harmless code merely to increase the comment count.

### Phase 2: Strengthen the change

After completing `REVIEW.md`:

1. Add focused tests that reproduce each issue you marked `BLOCKER`.
2. Implement the smallest fixes needed to make those tests pass.
3. Keep the public hook name `useAutosaveDraft`.
4. Run the existing tests, your new tests, and the strict type-check.

Do not rewrite the entire hook before you can demonstrate why a change is needed.

## Restrictions

- Do not use `any`.
- Do not delete or weaken an existing assertion.
- Do not replace the implementation with a third-party autosave library.
- Do not classify style preferences as blockers.
- Do not require a global state library.
- Keep timer and async behavior deterministic in tests.
- Any public API change must be justified in `REVIEW.md`.

## Acceptance criteria

- `REVIEW.md` identifies the most consequential merge risks and explains their impact.
- Every blocker is supported by a reproducible scenario or test.
- Proposed fixes match the severity and avoid unrelated redesign.
- The original tests continue to pass.
- Added tests pass and do not depend on real time or the network.
- `npm run typecheck` passes.
- The final implementation behaves predictably across rapid edits, changing inputs, async completion, and component lifecycle events.

## Suggested workflow

1. Run the tests and type-check without editing anything.
2. Read the tests first and write down exactly what contract they prove.
3. Trace one render, one content change, the timer callback, and the promise settlement.
4. Build a small event timeline for any suspected async issue.
5. Rank findings before writing comments.
6. Write the review before changing the implementation.
7. Convert blocker scenarios into deterministic tests.
8. Make narrow fixes and rerun the full suite.

## Questions to answer in your solution notes

- What behavior is guaranteed by the current tests?
- Which production assumptions are not represented in the test suite?
- What is the single highest-risk finding, and why?
- Which comments did you intentionally leave out because they were low value?
- Does the hook need cancellation, result invalidation, or both?
- Which responsibilities belong in the hook, and which belong in the injected save function?

## Bonus challenges

- Add an optional retry policy while keeping retries observable and cancellable.
- Design an API that accepts an `AbortSignal`, then explain which guarantees it adds and which it does not.
- Test the hook under `StrictMode` and document any behavioral differences.
- Add a minimal editor harness that renders accessible status feedback without coupling the hook to specific copy.

## If you get stuck

- Passing tests tell you what was checked, not that the implementation is complete.
- Write down the values captured by the timer callback and the promise handlers.
- Compare the time a request starts with the time its result changes hook state.
- Treat each document identity as a separate stream of work.
- Ask whether every valid document body follows the same path.

## When you submit your answer

Share `REVIEW.md`, your diff, or your commit. The response will give concise corrections and exactly one takeaway. It will judge prioritization, technical accuracy, evidence, proposed fix scope, and whether your tests prove the risks you identified.
