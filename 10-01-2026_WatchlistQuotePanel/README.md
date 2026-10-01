# Watchlist Quote Panel

You're on the trading desk's internal tools team. `QuotePanel` is the sidebar widget traders use to see the latest price, percent change, and volume for whichever symbol is selected in their watchlist. It's been live for a few weeks, the test suite is green, and nobody's touched it since - until a support ticket showed up this morning that's got the desk lead on edge.

## Setup

```
cd 10-01-2026_WatchlistQuotePanel
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `QuotePanel` exported from `starter.tsx` with its current props (`symbol`, `displayName`, `fetchQuote`) and behavior from the outside - loading, then either an error or a quote, with a big-mover badge when appropriate. You're free to restructure the internals (a custom hook, a reducer, whatever you like) - the seam at the top of the test file is where you reconcile any prop or markup changes, not the individual test cases.
- Don't "fix" this by making the panel ignore every fetch after the first one, or by adding an artificial delay/debounce before switching symbols. The panel still needs to correctly show a new symbol's quote every time the selection actually changes - it just needs to never show the wrong symbol's numbers.

## Running Tests

```
npm test
```

## The Challenge

`QuotePanel` takes a `symbol`/`displayName` pair and an injected `fetchQuote` function (the real one hits the streaming quote gateway; tests inject a fake). Whenever the watchlist selection changes, it kicks off a fetch and renders a loading state, an error state, or the quote itself - flagging the panel as a big mover when the percent change crosses a threshold in either direction.

A ticket came in from the premarket desk: traders scanning the watchlist before the open - clicking through four or five symbols in a row while they get their bearings - occasionally see a panel where the header names one ticker but the price underneath clearly belongs to a different one they clicked past a moment ago. It's intermittent, nobody's been able to catch it happening on the office connection, and it looks completely fine every time someone tests it by clicking through symbols slowly and deliberately. That combination - fine when you go slow, wrong sometimes when you go fast - is exactly the kind of report that's easy to shrug off, and exactly the kind that gets a trader to stop trusting the number on their screen.

The desk lead now wants to ship a "pin and auto-refresh" feature next sprint - keep today's pinned symbol's quote silently refreshing every couple of seconds so nobody has to reselect it - and has asked for this ticket closed out first, since an automatic refresh loop would turn an occasional glitch into a constant, obvious one if the underlying issue is real. Find it and fix it before that lands.

## Goals

- Make the code easier to maintain and extend long-term.
- The panel should always reflect the quote for whichever symbol is currently selected, no matter how the underlying fetches happen to resolve relative to each other.
- Leave the component in a shape where the planned auto-refresh feature can be added without reintroducing the same glitch.

## Bonus Challenge

- Add the pin-and-auto-refresh behavior the desk lead asked for: while a symbol is selected, re-fetch its quote every 2 seconds without a full re-mount, and without ever being able to display a stale symbol's data if the selection changes mid-poll.

## If you get stuck

- The bug won't show up in the existing test suite, and it won't reliably reproduce by hand either - it depends on the relative timing of two network responses. Try writing a scratch test (or a few console logs) where you control exactly when each fetch resolves, and resolve an earlier request's promise *after* a later one.
- `useEffect`'s cleanup function runs right before the effect re-runs for a new dependency value, and again on unmount. What does this component's cleanup currently do with that opportunity?
- By the time a `.then()` callback finally executes, is there anything inside it that can tell whether the request it belongs to is still the one the component actually cares about?

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
