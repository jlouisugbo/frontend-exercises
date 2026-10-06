# Fleet Health Panel

You're building a piece of Nimbus, a fleet-monitoring dashboard for industrial IoT sensors (chillers, dock sensors, motor monitors) deployed across customer facilities. Field techs pick a device from the sidebar to check its live battery, signal, and last-seen status before heading out on a maintenance run.

## Setup

```
cd 10-06-2026_FleetHealthPanel
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `FleetHealthPanel` exported from `starter.tsx` with its current props (`devices`, `fetchDeviceHealth`, `pollIntervalMs`) and its outward behavior - clicking a device loads that device's health, with a loading state while the fetch is in flight, an error state if it fails, and an auto-refresh that quietly re-checks the selected device every `pollIntervalMs`. You're free to restructure the internals (the effect, a ref, a request id, whatever you like) - the seam at the top of the test file is where you reconcile any prop or markup changes, not the individual test cases.
- Don't "fix" this by dropping the auto-refresh poll - techs rely on it to catch a draining battery before a device drops offline, and the panel needs to end up right regardless of when a poll tick lands relative to a tech switching devices.

## Running Tests

```
npm test
```

## The Challenge

`FleetHealthPanel` shows a sidebar of devices; clicking one calls the injected `fetchDeviceHealth(deviceId)` and renders whatever comes back. So the reading doesn't go stale while a tech is staring at one device, a background timer quietly re-calls the same fetch every `pollIntervalMs` for whichever device is currently selected - that got bolted on last sprint after techs complained about having to manually hit refresh.

A few techs doing a quick walkthrough - tapping down the device list to spot-check several units before heading out - have reported the panel occasionally settles on a reading that doesn't match the device highlighted as selected: battery and signal numbers that belong to a device they clicked away from a second ago, sitting under the name of the device they're now looking at. It's intermittent, and nobody's been able to pin it to a specific device or facility.

Ops wants to drop the poll interval from the current 10 seconds down to 3, so a fast battery drain gets flagged before a device actually goes dark. Nobody wants to ship that until the mismatch is understood, since a shorter interval just means more timer ticks landing in the middle of whatever's causing it.

## Goals

- Make the code easier to maintain and extend long-term.
- The panel should always display the health reading for whichever device is currently selected, no matter how the manual fetch and the poll's fetch happen to resolve relative to each other.
- Leave the fetch-and-render logic in a shape where shortening `pollIntervalMs` doesn't make the problem more frequent.

## Bonus Challenge

- Add a lightweight in-memory cache keyed by `deviceId`, so re-selecting a device the panel already has a recent reading for shows it instantly while a fresh read comes in behind it - without ever letting a stale read for a device the tech has since clicked away from land in the panel.

## If you get stuck

- The existing test suite won't catch this one - it depends on the relative timing of two health reads for two different devices, which is hard to force without controlling exactly when each one's promise settles.
- Both the click handler and the poll timer end up calling the same function to load a reading. What does that function actually know about which device it was called for, by the time its promise resolves?
- Compare what a given fetch call "knows" about which device it was for against what the code actually checks when that fetch's result comes back.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
