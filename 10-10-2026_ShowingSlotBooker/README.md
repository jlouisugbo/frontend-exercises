# Showing Slot Booker

Meridian Realty's listing site wires the "Request This Time" button on every open showing slot straight to one function: check whether the buyer qualifies, and if so, hold the slot. It's covered every listing since launch.

## Setup

```
cd 10-10-2026_ShowingSlotBooker
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `requestShowing`'s exported name and its current eligibility rules (blackout window, no-show flag, max concurrent requests, slot capacity) intact, in that order. You're free to change its signature and whatever else lives in this file.

## Running Tests

```
npm test
```

## The Challenge

`requestShowing` is the only thing standing between a buyer clicking "Request This Time" on a listing's open slot and actually holding that slot. It checks four things in order - whether the slot falls inside a window the seller blacked out (an open house day, a final walkthrough), whether the buyer's account is currently flagged for repeated no-shows, whether booking it would push the buyer over their limit on simultaneously-active requests, and whether the slot actually has room left - and if all four pass, it holds the slot and adds it to the buyer's active requests.

That's been fine, because the only caller is the real "Request This Time" button, clicked by someone who has already decided to book that specific slot.

Now the listings team wants a live availability indicator next to every time slot on a popular property's page - a small dot that updates every few seconds while a buyer is browsing, so they can see at a glance which slots are filling up before they commit to one. The obvious way to wire this up is to call the exact same function the Request button calls, on a timer, and color the dot off whatever it returns. The one thing nobody's tested yet: what happens to a single-slot open house with one spot left when a few dozen buyers have that page open in the background, each polling it for the indicator?

## Goals

- Make the code easier to maintain and extend long-term.
- Support a way to check showing availability that's safe to call as often as the listing page wants, without it being able to affect who actually ends up holding the slot.
- Keep `requestShowing`'s existing four eligibility rules and their order intact - this isn't about changing what makes a buyer eligible, just about how checking and committing relate to each other.

## Bonus Challenge

- Add a lightweight audit log (an in-memory array is fine) that records every *committed* booking - but not every availability check - so the brokerage can later answer "how many showings were actually booked for this listing" without the count being inflated by page-view traffic.

## If you get stuck

- Write down, in one sentence each, what "check if a buyer can book this slot" means and what "book the slot" means. Does `requestShowing` currently do only one of those?
- If the listing page called `requestShowing` twice in a row for the same buyer and slot - once for the live availability dot, once for the real "Request This Time" click - what would the second call see that the first call didn't cause?
- Look for a way to answer the eligibility question without touching `slot.capacityRemaining` or `buyer` at all, plus a separate step that only runs once you already know the answer is yes.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
