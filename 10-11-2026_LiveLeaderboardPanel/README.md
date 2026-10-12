# Live Leaderboard Panel

FitPulse's step-count challenge screen shows a live leaderboard panel: whoever has the most steps today gets called out at the top. It's been accurate since launch - friends' step totals come in as a prop, and the panel figures out who's leading.

## Setup

```
cd 10-11-2026_LiveLeaderboardPanel
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep showing the no-data empty state when `scores` is empty, exactly like today. You're free to change anything about how the leader is figured out internally.

## Running Tests

```
npm test
```

## The Challenge

`LeaderboardPanel` takes a `scores` prop - one entry per friend, each with a step count - and shows whoever currently has the most steps. It's a small, simple panel: given the scores, say who's leading.

A "Live Mode" toggle is going into the challenge screen: when it's on, the parent screen polls a background sync every few seconds and merges in fresh step counts. Friend lists can run into the hundreds during a company-wide challenge, so for performance, Live Mode updates the existing `scores` array in place - adjusting step counts on the same array object - instead of building a brand-new array on every tick, to avoid re-rendering every other part of the screen that also holds a reference to that same array.

QA's early build note: they turned Live Mode on, let it run for a minute, and the leaderboard panel kept showing the same leader the entire time - even though the step counts visible elsewhere on the screen had clearly changed, and a different friend had actually pulled ahead.

## Goals

- Make the code easier to maintain and extend long-term.
- Make sure the leaderboard always reflects the latest `scores`, including when Live Mode updates the array in place rather than replacing it.
- Keep showing the no-data empty state when `scores` is empty, same as today.

## Bonus Challenge

- Show the margin between the leader and whoever's in second place (e.g. "+340 steps ahead of Cass"), figured out the same way the leader itself is, so the two can't drift apart from each other.

## If you get stuck

- Does this component need to keep its own copy of "who's leading" in state at all, or is it something that can be figured out fresh on every render?
- If two renders pass the exact same array object (just mutated in between), what does React actually compare to decide whether a dependency has "changed"?
- Try figuring out the leader directly in the render body (with or without `useMemo`) instead of inside an effect, and see whether Live Mode's in-place updates show up right away.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
