# Device Rollout Scheduler

Lumen Home's ops dashboard manages firmware rollouts for the smart thermostats and locks installed across its managed apartment portfolio. Every device update goes out through a capacity-limited "wave," and the dashboard's "Push Update" button on each device is wired straight to one function: check whether the device qualifies for the current wave, and if so, schedule it.

## Setup

```
cd 10-11-2026_DeviceRolloutScheduler
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `requestRollout`'s exported name and its current eligibility rules (device must be online, firmware not already current, battery threshold for battery-powered devices, maintenance freeze window, no update already pending, wave capacity) intact, in that order. You're free to change its signature and whatever else lives in this file.

## Running Tests

```
npm test
```

## The Challenge

`requestRollout` decides whether a single device can join the firmware wave currently rolling out, and if it can, schedules it right there: it decrements the wave's remaining capacity, adds the device to the wave's scheduled list, and marks the device as having an update pending. It runs six checks in order - is the device online, is it already on the target firmware, does a battery-powered device have enough charge to survive a flash, is the wave inside a maintenance freeze, does the device already have an update pending, and does the wave have any capacity left - and schedules the device the moment all six pass.

That's worked fine, because the only thing calling it has been the "Push Update" button next to a single device, clicked by someone who already decided to update that one device right now.

Ops now wants a dry-run view before kicking off a wave for a building: given the wave's settings, show how many of the ~2,000 devices across the portfolio would actually qualify, so they can size the wave's capacity correctly before committing to a number and notifying tenants about the maintenance window. The obvious way to build it is to loop over every device and call the same function the Push Update button calls, then count how many came back eligible. Nobody's checked yet what a few thousand of those calls do to a wave that hasn't even started.

## Goals

- Make the code easier to maintain and extend long-term.
- Support a way to check whether a device qualifies for a wave that's safe to call thousands of times while sizing the wave, without it scheduling anything or touching the wave's or any device's state.
- Keep `requestRollout`'s existing six eligibility rules and their order intact - this isn't about changing what makes a device eligible, just about how checking and scheduling relate to each other.

## Bonus Challenge

- Add a lightweight audit log (an in-memory array is fine) that records every device actually *scheduled* for an update - but not every dry-run check - so ops can later answer "how many devices did wave 14 actually touch" without the count being inflated by sizing runs.

## If you get stuck

- Write down, in one sentence each, what "can this device join the wave" means and what "schedule this device" means. Does `requestRollout` currently do only one of those?
- If the dashboard called `requestRollout` for the same device twice in a row - once during wave sizing, once for the real Push Update click - what would the second call see that the first call didn't cause?
- Look for a way to answer the eligibility question without touching `wave.capacityRemaining`, `wave.scheduledDeviceIds`, or `device.pendingUpdateCount` at all, plus a separate step that only runs once you already know the answer is yes.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
