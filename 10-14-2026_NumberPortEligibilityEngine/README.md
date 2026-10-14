# Number Port Eligibility Engine

MobileFirst Wireless lets customers bring their number over from another carrier through a self-service "Bring Your Number" flow. One function decides whether a line qualifies to port in today, and if it does, kicks the port off. It's been the whole flow since launch.

## Setup

```
cd 10-14-2026_NumberPortEligibilityEngine
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `attemptPortIn`'s exported name and its current eligibility rules (account standing, no port already in progress, PIN match, batch slot availability) intact, in that order. You're free to change its signature and whatever else lives in this file.

## Running Tests

```
npm test
```

## The Challenge

`attemptPortIn` checks four things in order - whether the losing carrier's account is in good standing, whether the number already has a port in progress, whether the PIN the customer typed matches the account on file, and whether today's porting batch still has a slot open - and if all four pass, it reserves the slot and flips the line into `in_progress`.

That's been fine, because the only caller is the final "Start My Port" button, clicked once a customer has filled out the whole form and committed.

Now support wants the PIN field itself to give instant feedback: as soon as a customer tabs out of the PIN input, the page should show a green check or a red "doesn't match" message, using the exact same eligibility check the Start button uses. It seems like free reuse - same function, same inputs, just called earlier. Nobody's traced through what happens when a customer fat-fingers their PIN twice before getting it right, tabbing out of that field three times in a row, on a day where the batch only had two slots left to begin with.

## Goals

- Make the code easier to maintain and extend long-term.
- Support a way to check port-in eligibility that's safe to call as often as the PIN field's blur handler wants, without it being able to affect which lines actually end up mid-port or how many batch slots are left.
- Keep `attemptPortIn`'s existing four eligibility rules and their order intact - this isn't about changing what makes a line eligible, just about how checking and committing relate to each other.

## Bonus Challenge

- Add a lightweight in-memory log that records every *committed* port start - but not every PIN-field check - so ops can later answer "how many ports actually kicked off today" without the count being inflated by blur-triggered traffic.

## If you get stuck

- Write down, in one sentence each, what "check if this line can port in" means and what "start the port" means. Does `attemptPortIn` currently do only one of those?
- If the PIN field's blur handler and the real Start button both ended up calling `attemptPortIn` for the same line - one to preview, one to commit - what would the second call see that the first call didn't cause?
- Look for a way to answer the eligibility question without touching `batch.slotsRemaining` or `line.portStatus` at all, plus a separate step that only runs once you already know the answer is yes.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
