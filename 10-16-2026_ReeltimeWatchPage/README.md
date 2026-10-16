# Reeltime Watch Page

Reeltime's watch page renders everything below the player off one shared playback hook - the scrub bar, the volume control, the video info panel, and the related-videos list all just call it and grab whatever field they need.

## Setup

```
cd 10-16-2026_ReeltimeWatchPage
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `WatchPage` exported with its current props (`video`, `related`, `tickMs`) and the same rendered testids - the scrub bar, volume control, video info panel, and related videos list all need to keep showing up the same way from the outside. You're free to restructure how data flows between them internally.
- Keep the playback clock actually ticking (don't rip out the interval) - the scrub bar still needs to advance in real time once a video is playing.

## Running Tests

```
npm test
```

## The Challenge

`WatchPage` wraps a `PlaybackProvider` around four pieces of UI, each of which pulls what it needs from one `usePlayback()` hook: the player's current position and volume, plus the video's own metadata and its related-videos list. It made the watch page trivial to build out - add a new piece anywhere under the provider, call the hook, grab whatever field you need. Nobody had to think about where any particular value lived.

The player ticks its clock every quarter second once a video is playing, which is the whole point - the scrub bar needs to keep moving. Product now wants a single analytics ping to fire the moment the info panel's content actually changes - when someone switches to a different video and a new title and description show up - not on every tick of the clock. Engineering's first attempt wired the ping straight into the info panel's render. QA played one ten-second clip without touching anything else, and the ping fired dozens of times - once per tick - even though the title and description never changed once.

Nobody's touched the related-videos list the same way yet, but it reads from the exact same place the info panel does, so whatever's true for one is quietly true for the other too.

## Goals

- Make the code easier to maintain and extend long-term.
- The video info panel and related-videos list should only do new work when the data they actually display changes - not on every tick of the playback clock.
- Keep the scrub bar and volume control updating live, exactly as they do today.

## Bonus Challenge

- Add a simple render counter (even a `console.log`) to the info panel and the related-videos list, let a video "play" for a few seconds, and confirm how many times each one actually re-renders before and after your change.
- A "buffering" indicator is coming next, driven by the same player state. Make sure adding it doesn't drag the info panel or related list along for the ride either.

## If you get stuck

- Every component under the provider calls the same hook for the same one context value. Does the info panel actually need to know the current playback position, or does it just happen to receive it along with everything else?
- What does React compare to decide whether a component needs to re-render when a context value changes - the whole value, or something more specific about what that component reads?
- Two different pieces of state here change at very different rates: every quarter second, versus only when the video itself changes. What does that suggest about whether they belong in the same place?

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
