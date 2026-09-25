# Work Order Queue

**Exercise #5 · Focus:** architecture tradeoffs  
**Difficulty:** 1/5  
**Target time:** 40–55 focused minutes

## Scenario

An operations team reads work orders in a dashboard and downloads the same queue for spreadsheet reporting. Each surface needs a different row shape, but both must show the same records in the same order for the same viewer and options. Records come from an API adapter as untrusted values. Agents may see their own assigned work and unassigned work; managers may see all work. Closed orders are hidden unless requested.

The current implementation shipped under a deadline. It passes the existing tests. As the product grows, changes to queue rules take longer than expected to review: engineers must verify the dashboard and export separately, and support has started comparing their outputs manually.

## The breaking point

Next sprint introduces a compact mobile queue. It should select exactly the same work orders, in the same order, for the same user and filters, but render a third row shape. Product also expects the access rule to change for one team soon. Your design should make both changes straightforward without altering today's dashboard or export behavior. You do **not** need to implement the mobile output in the required work.

## Your task

Refactor `starter.ts` to clarify which decisions belong to the work-order queue and which belong to each output surface. Keep both exported functions and their current return shapes. A reviewer should be able to find the one place to change the queue's access, filtering, and ordering rules and explain how a new output surface would use them.

Treat the API records as untrusted at the boundary; preserve the existing behavior of skipping invalid records without preventing later valid records from appearing. Keep different output shapes distinct. This is an architecture exercise, so explain the tradeoff you chose instead of adding abstraction solely for its own sake.

## Restrictions

- No `any`, double-cast of untrusted data, new dependencies, network calls, or database.
- Do not weaken or delete existing behavioral assertions.
- Do not relax the access rule or change the existing public row shapes.
- Avoid turning the entire input into trusted `WorkOrder` values before checking their fields.
- You may add focused tests and change private helpers. If you change a public signature, document why and adapt only the clearly marked test seam.

## Acceptance criteria

- `npm test` and `npm run typecheck` pass under strict TypeScript.
- The same user, options, and input yield the same ordered IDs in dashboard and export.
- Agents cannot see another agent's assigned orders; managers can. Unassigned work is visible to both.
- Closed work, trimmed case-insensitive search by ID or title, newest-first ordering, and ID tie-breaking retain their current behavior.
- Malformed API records are skipped, and later valid records still appear. The input array is never sorted or mutated in place.
- Dashboard formatting and export formatting retain their distinct contracts.
- A change to queue policy should not require the team to edit separate policy code for each surface.

## Suggested workflow

1. Run the baseline checks, then identify what each function decides and what it merely formats.
2. Trace a manager request, an agent request, a malformed record, and two equal timestamps through both functions.
3. Write down an interface for the work each prospective mobile view would need; do not implement it yet.
4. Refactor in small steps, rerunning both checks. Add one test if you find a behavior the supplied tests miss.
5. In a short note, describe one alternative you considered and why you did not choose it.

## Questions to answer when you submit

- Where does an untrusted record become usable by queue decisions?
- If the access rule changes next week, how many places must be edited?
- What information would a third presentation surface need, and what should it *not* know?
- What might be the downside of a very generic queue framework for this size of application?

## Bonus challenges (not required)

- Add a compact mobile view and prove that its IDs match the other surfaces for identical inputs.
- Add a rule that managers may view closed work but agents cannot, with tests for both surfaces.
- Propose a typed diagnostic for skipped records without exposing internal details in the UI.
- If the API contract changes to allow a fourth priority, identify the code and tests that should change.

## Hints

<details><summary>Hint 1</summary>

Compare the work performed before each function starts building its output rows.

</details>

<details><summary>Hint 2</summary>

Consider which intermediate values a third consumer could safely reuse without depending on dashboard or CSV vocabulary.

</details>

<details><summary>Hint 3</summary>

One small shared step may be enough; you do not need a plugin system or an abstract class.

</details>

## Setup and submission

From **inside this dated directory**, using Node 20 or newer:

```bash
npm ci
npm test
npm run typecheck
```

For watch mode, run `npm run test:watch`. All supplied tests pass against the starter. Share your branch, diff, and brief answers to the questions above after working through it. The review will give concise corrections and exactly one takeaway. Passing tests alone does not demonstrate the architecture criterion; the shape of the refactor matters.
