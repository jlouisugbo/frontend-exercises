# Lineup Eligibility Rules

The fantasy platform has two screens that both need to answer the same question - "can this player go in this roster slot?" `canAddToLineup` backs the weekly roster-submission screen and has been solid for two seasons. `canCompleteTrade` backs the newer trade-review flow, added this spring by someone who matched its shape by eye rather than calling into the first function, since there wasn't a shared rules module at the time.

## Setup

```
cd 10-06-2026_LineupEligibilityRules
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `canAddToLineup` and `canCompleteTrade` exported with their current names and signatures (`(player, slot) => boolean` / `(incomingPlayer, destinationSlot) => boolean`).
- You're free to have one call the other, extract a shared helper, or anything in between - the point is that the two surfaces should no longer be able to disagree about the same player/slot combination.

## Running Tests

```
npm test
```

## The Challenge

Both functions check a player's status against a destination slot before letting them in. `canAddToLineup` has always made an exception for `injured_reserve` players: they can go into the dedicated `ir_slot`, but nowhere else. `canCompleteTrade`'s comment explains why it never grew that same check - historically, trades only ever moved players onto the bench, and IR players couldn't be traded at all, so the scenario never came up.

That stopped being true last month, when the league turned on same-day trades that drop the incoming player straight into whichever slot the trade specifies - including a starter slot. Support has started getting tickets about IR players showing up in people's starting lineups right after a trade, something the roster-submission screen would never have allowed if they'd tried to add that same player directly. A few users on the league's forums have already figured out that trading is currently the only way to do this, right before kickoff, when it matters most for who actually plays that week.

## Goals

- Make the code easier to maintain and extend long-term.
- `canCompleteTrade` should enforce the same injured_reserve/slot restriction `canAddToLineup` already does, so a trade can't place an IR player anywhere canAddToLineup wouldn't have allowed them.
- Leave the two functions unable to drift apart like this again - a future rule change should only need to happen in one place.

## Bonus Challenge

- There's a `taxi_squad` slot for development players coming next. Sketch out what adding it would require today in both functions, and whether your refactor turns that into a one-place change.

## If you get stuck

- Read `canAddToLineup` and `canCompleteTrade` side by side, line by line. Where exactly do they stop agreeing with each other?
- `canCompleteTrade`'s comment gives a reason its missing check was never a problem. Is that reason still true today?
- What would it take to make it structurally impossible for these two functions to disagree about the same player and slot, rather than just fixing today's specific gap?

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
