# Route Quote Panel

You're building a feature for Wanderlux's agent console: an internal tool reservation agents use while on the phone with customers, picking an origin and destination from two dropdowns to see the current best fare before quoting a price.

## Setup

```
cd 10-04-2026_RouteQuotePanel
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `RouteQuotePanel` exported from `starter.tsx` with its current props (`origins`, `destinations`, `fetchRouteQuote`) and its outward behavior - picking an origin and destination loads that route's fare, with a loading state while the fetch is in flight and an error state if it fails. You're free to restructure the internals (`useRouteQuote`, a ref, a request id, whatever you like) - the seam at the top of the test file is where you reconcile any prop or markup changes, not the individual test cases.
- Don't "fix" this by disabling the dropdowns while a fetch is in flight - agents compare several routes quickly while a customer is deciding, and the panel should still end up right no matter how fast they click through options.

## Running Tests

```
npm test
```

## The Challenge

`RouteQuotePanel` lets an agent pick an origin and a destination and shows whatever fare `fetchRouteQuote(origin, destination)` resolves with. The fetch-and-render logic actually lives in a small hook, `useRouteQuote`, that got pulled out of the component last sprint so the round-trip panel (still in review) can reuse the same fetch-on-route-change logic for both legs of a trip without copy-pasting it.

A few agents have reported the fare panel occasionally "flickers" to a route they weren't even looking at anymore - they'll change the destination while comparing a couple of options, and for a moment (or sometimes it sticks) the panel shows a fare for a city they picked a second ago, not the one currently selected in the dropdown. Support couldn't reproduce it on a slow connection, only when agents were moving quickly between options - which is exactly how the busiest agents work mid-call.

Wanderlux wants to ship the round-trip panel next, which means mounting `useRouteQuote` twice in the same component and letting agents adjust either leg independently mid-comparison - twice the concurrent fetches in flight, twice the chances for one to land out of order. Whatever's behind the flicker needs to be sorted out before that reuse ships, or it'll just show up twice as often.

## Goals

- Make the code easier to maintain and extend long-term.
- The panel should always reflect the fare for whichever origin/destination pair is currently selected, no matter how the underlying fetches happen to resolve relative to each other.
- Leave `useRouteQuote` in a shape where a second, independent instance of it (for the upcoming round-trip panel) won't be exposed to the same bug.

## Bonus Challenge

- Add a lightweight in-memory cache inside `useRouteQuote` keyed by `${origin}:${destination}`, so re-selecting a previously-seen route renders instantly - without ever letting a slow fetch for a route the agent has since navigated away from land in the panel.

## If you get stuck

- The existing test suite won't catch this one - it depends on the relative timing of two fetches for two different routes, which is hard to force without controlling exactly when each one's promise settles.
- The fetch does run inside a `useEffect` here, so there's a cleanup function available - is anything actually using it?
- Compare what the first fetch call "knows" about which route it was for against what the hook checks against when that fetch's result actually comes back.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
