# Live Auction Ticker

BrickLane runs live courthouse auctions for foreclosure and estate properties, and `AuctionTicker` is the bid readout bidders watch from their tablets. It was built the week before the county's first tablet-only auction pilot.

## Setup

```
cd 10-13-2026_LiveAuctionTicker
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `AuctionTicker` exported with its current props (`lotId`, `subscribeToFeed`, `fetchLotStatus`) and rendered output (the same `data-testid`s, the same fallback behavior) - the push feed should still get a real grace window before falling back, and the fallback should still show bidders a "Reconnecting…" notice.
- Don't "fix" this by removing the fallback poll, or by polling on every render instead of only when the feed is slow - the feed-first, poll-as-backup shape is intentional.

## Running Tests

```
npm test
```

## The Challenge

`AuctionTicker` shows the current highest bid and bidder count for whichever lot is up on the block. It tries a live push feed first - `subscribeToFeed` opens a connection and calls back with every update the instant it lands - but courthouse wifi is unreliable, and on a bad connection the feed can take a couple of seconds (or longer) to confirm it's actually up. So the component gives it a short grace window, and if the feed still hasn't connected by the end of it, falls back to polling the REST endpoint directly until someone notices.

It's worked fine in every test run so far, including the few manual passes against the real feed on office wifi - where a lot's feed either connects comfortably inside the grace window, or never connects for the whole time that lot happens to be on screen. Nobody has yet tried watching one lot's feed fail to connect, and then moving on to the next lot before the fallback has had a chance to catch up.

The county now wants a "fast-forward" mode for the routine, low-interest lots - a clerk could tap through several of them in a row without waiting for each one's feed to settle, for the ones nobody's seriously bidding on anyway. That means doing, deliberately and repeatedly, exactly the thing this component has never really been exercised against: moving to a new lot while the previous one's connection is still being sorted out.

## Goals

- Make the code easier to maintain and trust long-term.
- However a lot's feed situation resolves (connects in time, or falls back to polling), switching to a different lot should fully stop any work still going on for the lot left behind.
- Leave `AuctionTicker` in a shape where the "fast-forward" mode can move through lots quickly without anything from an earlier lot bleeding into a later one's display.

## Bonus Challenge

- Have the fallback poll stop itself if the feed does eventually connect mid-poll, instead of running the feed and the poll side by side indefinitely.

## If you get stuck

- `useEffect`'s cleanup function only has access to whatever variables exist in its surrounding scope at the moment it's defined. Where exactly does the fallback poll's interval id get created, relative to where the cleanup function is written?
- Add a quick `console.log` inside the fallback poll's tick, switch `lotId` a couple of times in a test (or in the browser), and watch what's still firing afterward.
- Everything this effect starts needs a way back out. For each thing it kicks off, ask what currently stops it, and when.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
