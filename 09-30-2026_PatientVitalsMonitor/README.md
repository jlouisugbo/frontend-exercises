# Patient Vitals Monitor

You're on the ops-tooling team for a hospital's internal nurse dashboard. `PatientVitalsPanel` is the sidebar widget nurses use to see a selected patient's latest heart rate, blood pressure, and SpO2 while working through the day's queue. It shipped a few weeks ago, has a green test suite, and mostly just works - which is why the bug report sitting in your queue this morning is confusing everyone who's looked at it.

## Setup

```
cd 09-30-2026_PatientVitalsMonitor
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `PatientVitalsPanel` exported from `starter.tsx` with its current props (`patientId`, `patientName`, `fetchVitals`) and behavior from the outside - loading, then either an error or a reading, with a critical-range warning when appropriate. You're free to restructure the internals (a custom hook, a reducer, whatever you like) - the seam at the top of the test file is where you reconcile any prop or markup changes, not the individual test cases.
- Don't "fix" this by making the panel ignore every fetch after the first one, or by adding an artificial delay/debounce before switching patients. The panel still needs to correctly show a new patient's vitals every time the selection actually changes - it just needs to never show the wrong patient's data.

## Running Tests

```
npm test
```

## The Challenge

`PatientVitalsPanel` takes a `patientId`/`patientName` pair and an injected `fetchVitals` function (the real one hits the bedside monitor gateway; tests inject a fake). Whenever the selected patient changes, it kicks off a fetch and renders a loading state, an error state, or the reading itself - flagging the panel as critical when heart rate or SpO2 crosses a threshold.

A ticket came in from the ICU floor: nurses moving quickly through the queue - clicking through three or four patients in a row while getting oriented at the start of a shift - occasionally see a panel that's clearly showing someone else's numbers, or one that never updates off the previous patient's reading even though the name at the top has changed. It's intermittent, nobody's been able to catch it happening on the fast office wifi, and it looks completely fine every time someone tests it by clicking through patients slowly and deliberately. That combination - fine when you go slow, wrong sometimes when you go fast - is exactly the kind of report that's easy to shrug off, and exactly the kind that erodes a nurse's trust in the tool fastest.

Ops now wants to add automatic polling on top of this - silently refresh the visible patient's vitals every couple of seconds so nobody has to reselect them - and they've asked you to sign off first, since faster automatic re-fetching would turn an intermittent glitch into a constant, obvious one if the underlying issue is real. Find it and fix it before that lands.

## Goals

- Make the code easier to maintain and extend long-term.
- The panel should always reflect the vitals for whichever patient is currently selected, no matter how the underlying fetches happen to resolve relative to each other.
- Leave the component in a shape where a future auto-refresh/poll feature can be added without reintroducing the same glitch.

## Bonus Challenge

Add the auto-refresh ops asked for: while a patient is selected, re-fetch their vitals every 2 seconds without a full re-mount, and without ever being able to display a stale patient's data if the selection changes mid-poll.

## If you get stuck

- The bug won't show up in the existing test suite, and it won't reliably reproduce by hand either - it depends on the relative timing of two network responses. Try writing a scratch test (or a few console logs) where you control exactly when each fetch resolves, and resolve an earlier request's promise *after* a later one.
- `useEffect`'s cleanup function runs right before the effect re-runs for a new dependency value, and again on unmount. What does this component's cleanup currently do with that opportunity?
- By the time a `.then()` callback finally executes, is there anything inside it that can tell whether the request it belongs to is still the one the component actually cares about?
