# Change Order Fast-Track Consistency

Meridian Construction Group lets project managers draft change orders in the field app and see a live estimate of whether it'll skip the GC's manager sign-off ("fast-track") or need manual review - before they ever hit submit. A superintendent just flagged that the live badge and what actually happens on submission don't always agree.

## Setup

cd 10-27-2026_ChangeOrderFastTrackConsistency
npm install

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `previewApprovalPath` and `finalizeChangeOrder` as the two public entry points - the change order drafting form and the submission/audit pipeline both call them directly by name.

## Running Tests

npm test

## The Challenge

`previewApprovalPath` runs live while a PM is drafting a change order, before anything has been submitted. `finalizeChangeOrder` runs when they hit submit - it's what actually creates the change order record the field team and the auditors rely on. Both are supposed to agree on whether a given order qualifies for fast-track routing, since the preview badge is really just supposed to show what submission will do.

Right now, each function works out fast-track eligibility on its own, re-deriving the same amount/category/tier logic from scratch. That was fine until the Riverside Ave incident, where a change order fast-tracked through for a client whose account had an open safety violation that nobody on the field team caught in time. Ops asked for any client with an open safety violation to always be routed to manual review from then on - that rule landed in the function that creates the actual order record, which felt like the right place at the time, but the live preview badge never got the same update.

The next item already in the backlog: procurement wants a similar automatic hold for clients with overdue retainage payments, probably next quarter. Whoever picks that up is going to be editing this same fast-track eligibility logic again, in whichever places it currently lives.

## Goals

- Make the code easier to maintain and extend long-term.
- A PM should see the same routing decision in the live preview badge as what actually happens on submission, for any client/order state that affects eligibility today.
- The next eligibility rule change (the retainage hold, or whatever comes after) should only require an edit in one place.

## Bonus Challenge

- Write a quick check (a test, or a scratch script) that compares the preview and final routing decisions for the same order/client across a range of inputs, so a future drift like this gets caught before it reaches a PM.

## If you get stuck

- Line up what each function checks before it decides an order is fast-track eligible. Are they actually checking the same things?
- Ask what happens the next time someone needs to add or change one of these conditions - how many places would they need to remember to touch?
- The in-code note about the Riverside Ave incident is a clue about when and where things diverged, not just history.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
