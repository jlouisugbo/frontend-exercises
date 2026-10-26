# Match Queue Presence

You're on the queue team at Still Water, a dating app whose whole pitch is "fewer, better matches." `MatchQueue` renders the stack of candidate cards for a session and keeps each card's "last active" presence label fresh without anyone refreshing the page.

## Setup

cd 10-26-2026_MatchQueuePresence
npm install

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep the public prop interface (`profiles`, `onDecision`, `presenceTickMs`) on `MatchQueue` intact, and keep `ProfileCard` wrapped in `memo` - other screens already render this queue and shouldn't need to change how they call it.

## Running Tests

npm test

## The Challenge

Each `ProfileCard` draws a compatibility score, truncates a bio, and renders a couple of buttons - not free work, which is why someone wrapped it in `memo` a while back on the theory that a card shouldn't have to redo any of that just because something else on the screen changed. Separately, `MatchQueue` polls the clock every few seconds so the "Active 2m ago" / "Online now" labels stay roughly accurate without a manual refresh.

It's held up fine through QA with a handful of seeded profiles, and liking or passing a card still behaves correctly. But growth wants to raise the default session size from around five candidates to thirty as part of the "extended radius" rollout, and a few support tickets are already describing the queue as stuttery and the Like/Pass buttons as "a little delayed" on mid-range phones - even when the person isn't doing anything, just sitting on the same card between ticks.

Before reaching for virtualization or cutting the compatibility ring animation, figure out why the memoized card isn't actually saving any work in the first place. Whatever is making it re-render every few seconds, it isn't the one thing a person actually does to a card - liking it or passing on it.

## Goals

- Make the code easier to maintain and extend long-term.
- Make sure the presence tick can keep refreshing the "Active Xm ago" labels without re-rendering cards whose own meaningful inputs haven't changed.
- Keep Like/Pass decisions working exactly as they do today.

## Bonus Challenge

- See if you can make your fix verifiable with a render-count assertion, the way the existing test does, rather than just eyeballing it in the browser.

## If you get stuck

- `memo` only skips a re-render when none of the props changed by reference (for objects and functions) or by value (for primitives). What does `ProfileCard` actually receive on every tick?
- Look at what gets constructed inside `MatchQueue`'s body on every render versus what could be constructed once and reused across renders.
- Try logging - or counting, like the tests do - how many times each card's render body actually runs across a few ticks, and compare that to how many of those ticks should have changed anything about that specific card.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
