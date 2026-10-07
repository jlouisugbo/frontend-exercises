# Now Playing Crossfade

Wavelength's web player added crossfading between tracks last sprint, so skipping doesn't feel like someone yanked a plug out of the wall. `NowPlayingBar` drives it: whenever the current track changes, it fades the old one out and the new one in over a few hundred milliseconds. It was built and tested against the demo playlist, which nobody ever skipped through quickly.

## Setup

```
cd 10-07-2026_NowPlayingCrossfade
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `NowPlayingBar` and `crossfade` exported with their current props/signatures and behavior from the outside - skip moves to the next track, the outgoing track fades down while the incoming one fades up, the skip button disables on the last track.
- Don't "fix" this by disabling the skip button while a fade is in progress, or by making fades instant. `crossfade` should still take its full, audible fade - it just must never have two fades running against the bar at the same time.

## Running Tests

```
npm test
```

## The Challenge

`crossfade` takes the track being faded out and the track being faded in, and ramps their volumes in opposite directions over a handful of ticks. `NowPlayingBar` calls it every time the selected track changes, and it works smoothly for a normal skip - wait for the fade, skip again, wait again.

A few beta testers who like to skip rapidly through a few tracks in a row (power-listening during a commute, apparently) have reported something odd: every so often, right after a skip, they can briefly hear the track from *before* the one they just skipped past, like it's still playing underneath the new one for a fraction of a second. It only ever happens when they skip quickly, back to back. Skipping once and waiting is always clean.

Product wants to ship a "press and hold to skip ahead" gesture next, for people who want to jump several tracks at once - which means deliberately doing, many times in a row and fast, exactly the thing that currently only happens by accident. This needs to be solid before that ships, or the occasional glitch becomes the normal experience for anyone who uses the new gesture.

## Goals

- Make the code easier to maintain and extend long-term.
- The bar should never have more than one fade affecting a track's volume at a time, no matter how quickly someone skips.
- Leave `NowPlayingBar` in a shape where the planned "hold to skip ahead" gesture can fire skips rapidly without reintroducing this.

## Bonus Challenge

- Implement the "press and hold to skip ahead" gesture itself (a button that advances one track every ~150ms while held) and confirm it stays clean even as a stress test.

## If you get stuck

- `crossfade` already returns something for exactly this kind of situation. Is anything on the calling side actually holding on to what it returns?
- If you skip a second time while the first fade's interval is still ticking, what happens to that original interval? Whose job is it to stop it?
- `useEffect`'s return value plays a specific role when its dependencies change again before the next run. What does this effect currently return?

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
