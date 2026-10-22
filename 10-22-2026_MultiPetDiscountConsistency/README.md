# Multi-Pet Discount Consistency

Furlong Veterinary Partners quotes pet owners an estimate when they book a visit online, then generates the actual invoice once the visit is done and it's time to pay. A front-desk complaint just came in: an owner was quoted a lower price in the app, then charged full price at checkout for the exact same visit.

## Setup

cd 10-22-2026_MultiPetDiscountConsistency
npm install

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `estimateVisitCost` and `finalizeInvoice` as the two public entry points - the scheduling app and the front-desk checkout screen both call them directly by name.

## Running Tests

npm test

## The Challenge

`estimateVisitCost` runs when an owner books online or calls to schedule, before anyone has shown up at the clinic. `finalizeInvoice` runs at checkout, once the visit is actually done - it's what generates the invoice and charges the card on file. Both are supposed to agree on whether a household qualifies for the multi-pet discount for a given visit, since one is really just a preview of the other.

Right now, each function works out multi-pet-discount eligibility on its own, re-deriving the same household-size/visit-type logic from scratch. That was fine until the front desk flagged a loophole: a few owners were booking non-emergency wellness visits for multiple pets just to get the discount, then asking the vet to work in an emergency add-on once they were already in the exam room. Ops asked for the discount to be pulled the moment that happens - that rule landed in the function that generates the actual bill, which felt like the right place for it at the time, but the estimate function never got the memo.

The next ask is already in the backlog: boarding add-ons (an overnight stay tacked onto a visit) are getting their own separate discount program next quarter, and whoever picks that ticket up is going to be editing multi-pet-eligibility logic again. Right now there's no single place to make that kind of change once.

## Goals

- Make the code easier to maintain and extend long-term.
- An owner should see the same discount decision at estimate time and at checkout, for any visit state that affects eligibility today.
- The next eligibility rule change (boarding add-ons, or whatever comes after) should only require an edit in one place.

## Bonus Challenge

- Write a quick sanity check (a test, or just a scratch script) that would have caught the estimate/invoice mismatch before it ever reached an owner - something that compares both functions' decisions for the same inputs.

## If you get stuck

- Line up what each function checks before it decides a visit is discount-eligible. Are they actually checking the same things?
- Ask what happens the next time someone needs to change one of these conditions - how many places would they need to remember to touch?
- The in-code comment about the front desk's loophole report is a clue about when and where things diverged, not just history.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
