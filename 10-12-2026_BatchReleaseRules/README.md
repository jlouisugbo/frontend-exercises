# Batch Release Rules

A food-manufacturing plant's warehouse system has two screens that both need to answer the same question - "can this batch of finished goods leave quality hold and move to this destination?" `canStageForPicking` backs the long-standing pick-list screen and has gated outbound batches since the plant's WMS went live. `canApproveShipment` backs the newer shipping-desk approval screen, added when direct-to-customer orders launched, and was written to match the first function's shape by eye rather than by calling into it.

## Setup

```
cd 10-12-2026_BatchReleaseRules
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `canStageForPicking` and `canApproveShipment` exported with their current names and signatures (`(batch, destinationFacility) => boolean`).
- You're free to have one call the other, extract a shared helper, or anything in between - the point is that the two screens should no longer be able to disagree about the same batch/destination combination.

## Running Tests

```
npm test
```

## The Challenge

Both functions check a batch's quality status against a destination facility before letting it move. `canStageForPicking` has always made an exception for `quarantined` batches: they can only move into the dedicated `QUARANTINE_HOLD` area, nowhere else. `canApproveShipment`'s comment explains why it never grew that same check - direct-to-customer shipping didn't exist when quarantine holds were introduced, and `recalled` was the only status anyone ever needed to block on that screen, so a quarantined batch never came up there.

That stopped being true two weeks ago, when the plant turned on same-shift cross-contamination holds: a batch can get flagged `quarantined` mid-shift, after it's already queued against a direct-to-customer order, and the shipping desk approves it before anyone on the floor realizes it's on hold. QA has already caught two shipments that went out to customers with an active quarantine flag - something the pick-list screen would never have allowed if someone had tried to physically stage that same batch for a regular dock. The plant is rolling out a third facility next quarter, a `RETEST_HOLD` lane for batches pulled back out of quarantine for re-inspection, and QA does not want a third copy of this rule drifting a third way once that work starts.

## Goals

- Make the code easier to maintain and extend long-term.
- `canApproveShipment` should enforce the same quarantined/facility restriction `canStageForPicking` already does, so a shipment can't be approved for a batch `canStageForPicking` wouldn't have allowed onto that dock in the first place.
- Leave the two functions unable to drift apart like this again - a future rule change should only need to happen in one place.

## Bonus Challenge

- Sketch out what adding the `RETEST_HOLD` lane next quarter would require today in both functions, and whether your refactor turns that into a one-place change.

## If you get stuck

- Read `canStageForPicking` and `canApproveShipment` side by side, line by line. Where exactly do they stop agreeing with each other?
- `canApproveShipment`'s comment gives a reason its missing check was never a problem. Is that reason still true today?
- What would it take to make it structurally impossible for these two functions to disagree about the same batch and destination, rather than just fixing today's specific gap?

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
