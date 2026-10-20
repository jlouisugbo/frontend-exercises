# Carrier Webhook Normalizer

Fleetline's ops dashboard shows every in-flight shipment across all of its carrier partners in one board. Every carrier POSTs tracking updates to the same webhook endpoint, each in its own payload shape, and `normalizeTrackingEvent` is the one function that turns whatever lands in the request body into the `TrackingEvent` the board renders.

## Setup

cd 10-20-2026_CarrierWebhookNormalizer
npm install

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `normalizeTrackingEvent`'s exported signature - `(body: unknown) => TrackingEvent`. Every carrier's webhook hits the same handler, so whatever carrier posted has to come in as the same unopinionated `unknown`.

## Running Tests

npm test

## The Challenge

`normalizeTrackingEvent` was written against the first two carriers Fleetline integrated, Swiftship and Cargex, and both of them happen to send an ISO timestamp for `eta` and a plain number of kilograms for `weight`. The function leans on that: one line casts the incoming body straight into the shape it expects, and everything downstream just reads off of it.

Sales has since closed four more carrier partners, and each new integration gets wired up fast, under whatever deadline closed the deal. Driftline, the newest one, mostly fits the same shape - except for two things nobody caught in review. Driftline marks a shipment as "not yet scheduled" by sending `eta: null` instead of omitting the field or sending a string, and its legacy weight export sometimes reports weight as a formatted string like `"12.4 kg"` instead of a bare number. Nothing crashes. Nothing even looks wrong in the code - it still compiles the same as it always did.

What actually happens is worse: ops started noticing random Driftline shipments sorted to the very top of the dashboard's urgency queue, as if they were decades overdue, and billing flagged a handful of shipments where the total declared weight for a multi-leg route came back as garbage instead of a number. Nobody has figured out yet that both symptoms trace back to the same function.

## Goals

- Make the code easier to maintain and extend long-term.
- Make sure a `TrackingEvent`'s `etaDate` and `weightKg` are things the rest of the codebase can actually rely on matching their declared types, not just hope so.
- Give a shipment with no known eta yet an honest representation, instead of a date that silently reads as 1970.

## Bonus Challenge

- Fleetline is onboarding a sixth carrier next sprint whose integration doc isn't finalized yet. Make it reasonably cheap to add support for a carrier with yet another slightly different payload shape, without touching every existing carrier's handling to do it.

## If you get stuck

- Walk through exactly where `body` stops being `unknown` and starts being treated as a known shape. What, if anything, actually checked that the real value matches?
- What does `new Date(null)` evaluate to? Is that the same thing as "we don't know the eta yet"?
- If a value's declared type and its actual runtime type can quietly diverge, what's available at the boundary where the data enters your system to make that divergence impossible to ignore?

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
