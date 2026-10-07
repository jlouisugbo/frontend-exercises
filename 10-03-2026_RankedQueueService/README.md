# Ranked Queue Service

Nova Arena's matchmaking backs ranked play across the main lobby and the spectator overlay. `MatchmakingQueue` has been the one source of truth for who's waiting and in what order since launch - until last week, when support needed a way to pull a VIP straight to the front of the line for a live conference demo, and nobody had time to touch the queue class itself that day.

## Setup

```
cd 10-03-2026_RankedQueueService
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `MatchmakingQueue`'s and `boostToFront`'s exported names, and the queue's existing `enqueue`/`dequeue`/`size` behavior, intact. You're free to change how the queue stores and protects its state internally.
- Don't "fix" this by deleting the VIP boost feature - support still needs a way to put a specific player at the front of the line on demand. It just needs to stop being a second way to produce a queue state `enqueue` would never have allowed.

## Running Tests

```
npm test
```

## The Challenge

`MatchmakingQueue` enforces two simple rules on every player who joins through `enqueue`: the queue never exceeds its configured size, and the same player can never be queued twice. Those rules have held for two seasons. `boostToFront` is newer - a small admin helper that jumps a player to the very front of the line so support can demo a match without waiting.

During a recent event, QA flagged two things that shouldn't have been possible: the ranked queue briefly reported more players than its configured cap, and - once - the same player appeared in the queue twice at once, in their normal spot and again at the front after being boosted mid-session. Nobody on the team could initially explain either report, since `enqueue` clearly checks for both of those exact conditions on every call.

Now growth wants to ship "Party Queue" - letting a group of 2-3 friends queue together and get matched adjacent to each other, which means something will need to reorder entries in the queue directly. Whoever picks up that ticket is going to look at the only existing precedent for moving players around - `boostToFront` - and build on it the same way, unless this gets sorted out first. Otherwise Party Queue just becomes a third way to produce the same impossible queue state.

## Goals

- Make the code easier to maintain and extend long-term.
- The queue should never exceed its configured max size or contain a duplicate player, no matter which code path adds or moves someone.
- Leave the queue in a shape where a future "reorder" feature (like Party Queue) doesn't have to choose between going through the existing safety checks or bypassing them entirely.

## Bonus Challenge

- Implement Party Queue: a way to add 2-3 players as a group so they land adjacent to each other in the queue, enforcing the same invariants as a normal `enqueue`.

## If you get stuck

- Compare what `enqueue` checks before adding a player against what `boostToFront` checks before moving one. Is there a reason the second one gets to skip what the first one treats as mandatory?
- `players` is declared as a plain, publicly accessible field. What is every caller - including code outside this file - currently free to do with it, and is all of that intentional?
- Think about what it would take to make "every player enters or moves through the same set of rules" true, no matter how many more admin tools get added to this file later.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
