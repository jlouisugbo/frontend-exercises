# Loyalty Rate Consistency

Harborview Hotels' booking flow shows guests a quoted nightly rate while they're browsing, then finalizes (and charges) a rate once they hit "Confirm Booking." A support ticket just came in: a guest saw a quote 10% below the sticker price, then got charged full price the moment they tried to pay.

## Setup

cd 10-17-2026_LoyaltyRateConsistency
npm install

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `getQuotedRate` and `finalizeBooking` as the two public entry points - other parts of the booking flow (the search page, the confirmation email job) call them directly by name.

## Running Tests

npm test

## The Challenge

`getQuotedRate` runs on the search results and booking-summary pages, showing a guest what they'd pay before they've committed to anything. `finalizeBooking` runs once they actually hit "Confirm Booking" - it's the function that commits the room hold and charges the card on file. Both are supposed to show the same loyalty discount for the same guest and the same stay, since one is really just a preview of the other.

Right now, each function works out loyalty-discount eligibility on its own, re-deriving the same tier/nights/rate-code logic from scratch. That was fine until Trust & Safety asked for one more rule: accounts with an active payment dispute shouldn't get the discount anymore, since a few of them were using it to book comped-looking stays mid-chargeback. That rule landed in the function that actually charges the card, which felt like the right place for it at the time - but the preview function never got the memo.

The next ask is already in the backlog: corporate-rate bookings (`rateCode: 'CORPORATE'`) are getting their own separate discount program next quarter, and whoever picks that ticket up is going to be editing loyalty-eligibility logic again. Right now there's no single place to make that kind of change once.

## Goals

- Make the code easier to maintain and extend long-term.
- A guest should see the same discount decision at quote time and at checkout, for any account state that affects eligibility today.
- The next eligibility rule change (corporate rates, or whatever comes after) should only require an edit in one place.

## Bonus Challenge

- Write a quick sanity check (a test, or just a scratch script) that would have caught the quote/checkout mismatch before it ever reached a guest - something that compares both functions' decisions for the same inputs.

## If you get stuck

- Line up what each function checks before it decides a booking is discount-eligible. Are they actually checking the same things?
- Ask what happens the next time someone needs to change one of these conditions - how many places would they need to remember to touch?
- The in-code comment about Trust & Safety's request is a clue about when and where things diverged, not just history.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
