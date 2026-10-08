# Fare Upgrade Engine

AltitudeAir's booking app wires "Upgrade My Seat" straight to one function: check the loyalty rules, and if everything lines up, take the seat. It's been solid since launch.

## Setup

```
cd 10-08-2026_FareUpgradeEngine
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `evaluateUpgrade`'s exported name and its current eligibility rules (top fare class, loyalty tier, per-trip step cap, seat availability) intact, in that order. You're free to change its signature and whatever else lives in this file.

## Running Tests

```
npm test
```

## The Challenge

`evaluateUpgrade` is the only thing standing between a passenger tapping "Upgrade My Seat" and actually getting bumped to premium economy, business, or first. It checks four things in order - whether they're already at the top, whether their loyalty tier allows upgrades at all, whether they've already used up their tier's allowed steps this trip, and whether a seat is actually open in the next class up - and if all four pass, it moves them into that seat and updates their record.

It's worked well since launch, mostly because the only caller is the "Upgrade My Seat" button itself, which only ever gets tapped once someone has already decided to commit.

Now loyalty wants a "See if I qualify" link on the seat map, right next to the upgrade button, that tells a passenger whether they're eligible before they commit to tapping anything - no confirmation screen, just an inline yes/no, so people stop tapping Upgrade and then complaining when nothing happens. The obvious way to build it is to call the exact same function the button already calls and show whatever it returns. QA's worry, raised in standup, is what happens when two passengers on a flight with exactly one open business-class seat both tap "See if I qualify" around the same time - does that seat still exist for whichever one of them actually commits afterward?

## Goals

- Make the code easier to maintain and extend long-term.
- Support a way to check upgrade eligibility that's safe to call as often as the UI wants, without it being able to affect who actually ends up with a seat.
- Keep `evaluateUpgrade`'s existing four eligibility rules and their order intact - this isn't about changing what makes someone eligible, just about how checking and committing relate to each other.

## Bonus Challenge

- Add a lightweight audit log (an in-memory array is fine) that records every *committed* upgrade - but not every eligibility check - so loyalty can later answer "how many platinum members actually upgraded last month" without the count being polluted by preview traffic.

## If you get stuck

- Write down, in one sentence each, what "check if someone is eligible" means and what "upgrade someone" means. Does `evaluateUpgrade` currently do only one of those?
- If the booking app called `evaluateUpgrade` twice in a row for the same passenger and flight - once for the new preview link, once for the real button - what would the second call see that the first call didn't cause?
- Look for a way to answer the eligibility question without touching `flight.seatsAvailable` or `passenger` at all, plus a separate step that only runs once you already know the answer is yes.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
