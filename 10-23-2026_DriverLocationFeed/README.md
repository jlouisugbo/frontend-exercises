# Driver Location Feed

You're on the dispatch tooling team at a ride-sharing company. `useDriverLocationFeed` keeps the live pin on the dispatch map moving for whichever ride a dispatcher has selected, and reconnects on its own the moment the feed reports a dropped connection, so the pin never just freezes mid-ride.

## Setup

cd 10-23-2026_DriverLocationFeed
npm install

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `useDriverLocationFeed`'s signature (`rideId`, and the optional `{ connect }` override) intact - other dispatch screens already call it this way.

## Running Tests

npm test

## The Challenge

The dispatch map opens a streaming connection for whichever ride is currently selected, updates the pin as location events come in, and - because driver phones routinely lose signal in tunnels, parking garages, and known dead zones around the city - reconnects automatically the moment the feed reports a drop. It's worked well enough that nobody's touched it since it shipped: switching between rides shows the right pin, and a dropped connection always comes back within a second or two.

Ops just asked for a per-connection health gauge on the internal status page, something SRE wants so they can catch a sudden spike before it takes down the location-streaming backend. The number they're seeing in staging - pulled straight from the feed client's own connection registry, not from anything this hook tracks - climbs steadily over the course of a single dispatcher's shift and never comes back down, even though that dispatcher is only ever actively watching one or two rides at a time. It's noticeably worse on days when a lot of drivers are passing through the city's spottier coverage areas.

Figure out why the connection count only ever goes up during completely normal use, never down, and fix it without changing how dispatchers actually experience the map - switching rides and automatic reconnect-on-drop both need to keep working exactly as they do today.

## Goals

- Make the hook's connection lifecycle trustworthy over a long shift, not just at the moment of mount or unmount.
- Make sure a connection that's no longer in use always gets released, however it stopped being used.
- Keep automatic reconnect-on-drop and ride-switching behavior working exactly as they do now.

## Bonus Challenge

- Once it's fixed, think about a connection that drops and reconnects several times in quick succession - flaky coverage, not one clean handoff. Walk through your fix against that sequence and convince yourself nothing still slips through.

## If you get stuck

- Every place in the hook that reassigns the "current connection" reference, ask what happens to the connection it's about to replace.
- The function the effect returns is only one way a connection's life can end. Is it the only code path in this file that ever calls `disconnect()`?
- Try tracing, call by call, exactly which connections get created and which get disconnected across this sequence: mount, one drop, a second drop, then unmount. Count them against each other.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
