# Price Drop Alert Feed

Riverside Auto's listing page shows a small banner the moment a car's price drops while you're looking at it. `PriceAlertBanner` opens a live connection to the pricing feed for whatever listing is on screen, and tears it down again whenever you move to a different car or leave the page.

## Setup

```
cd 10-18-2026_PriceDropAlertFeed
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `PriceAlertBanner` exported with its current `listingId` prop and rendered output (the `status`-role banner, the dismiss button) - you're free to restructure how the subscription is managed internally.
- Keep using `priceFeed` from this file to send and receive updates (don't swap in a different pub/sub mechanism) - the point is fixing how a connection's lifecycle is managed, not replacing it.

## Running Tests

```
npm test
```

## The Challenge

It's worked fine in every manual test anyone's run: open a listing, drop the price from another tab, watch the banner appear. Move to a different car, and the banner clears like it should. Nobody's filed a bug against it.

Now Trust & Safety wants to ship a "resume after a dropped connection" feature: if a shopper's network blips, every pricing subscription that was still alive right before the blip should pick back up automatically once the network's back, instead of silently going dark for the rest of the session. Someone wired up a quick internal tool to print how many connections the feed is still holding onto, just to sanity-check the reconnect logic before it ships - and the number came back way higher than the number of cars anyone could plausibly still be looking at. Nothing has thrown an error. Nothing in the UI looks wrong. But something is clearly holding on to connections it shouldn't still have, and the reconnect feature is about to make that very visible to shoppers, in the form of price-drop alerts for cars they stopped looking at hours ago.

## Goals

- Make the code easier to maintain and extend long-term.
- A listing's connection to the feed should be fully released once you've navigated away from it or the banner has unmounted - not just quieted down.
- Price-drop alerts should never be able to reach a listing you're no longer viewing, even after a reconnect.

## Bonus Challenge

- Add a quick check that mounts and unmounts `PriceAlertBanner` for three different listings in a row, then reads `priceFeed`'s tracked-connection count. What would you expect that number to be, and what is it actually before your fix?

## If you get stuck

- Look at exactly what the effect's cleanup function calls on the connection object, and compare that against the other method the connection exposes.
- "Stopped receiving updates" and "no longer exists" aren't the same guarantee. Which one does a listing actually need once you've navigated away from it?
- Nothing here throws, logs, or fails a test on its own - that's exactly why a quick manual check of one listing at a time never catches it. What would you have to look at to notice something's wrong?

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
