# Username Availability Field

You're on Loopline's growth team, mid-revamp of the creator signup flow. `UsernameField` is the live handle picker: type a username and get instant feedback - too short, checking, available, taken (with a suggestion), or an error - with the Continue button only lighting up once the current handle is confirmed free.

## Setup

```
cd 10-02-2026_UsernameAvailabilityField
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `UsernameField` exported from `starter.tsx` with its current props (`checkAvailability`, `minLength`, `debounceMs`) and its behavior from the outside - typing settles into a debounced check, then one of the status states, with Continue enabled only when truly available. You're free to restructure the internals (a reducer, a request-id guard, whatever you like) - the seam at the top of the test file is where you reconcile any prop or markup changes, not the individual test cases.
- Don't "fix" this by disabling the input while a check is in flight, or by dropping the debounce so every keystroke fires its own check immediately - the field needs to stay typable and feel instant, and it should still only hit the availability service after typing settles. It just must never show a stale check's result for a username the person has since changed.

## Running Tests

```
npm test
```

## The Challenge

`UsernameField` takes an injected `checkAvailability` function (the real one hits Loopline's handle-registry service; tests inject a fake). As the person types, keystrokes get debounced, then the settled value is checked, and the component renders whichever status comes back - too-short, checking, available, taken, or an error - with a suggested alternative when one's taken.

A couple of beta reports came in this week that are hard to make sense of. One tester said they typed quickly through a few handle ideas while brainstorming, saw "available" light up green on one of them, clicked Continue - and the signup call failed server-side because that handle had actually been taken for weeks. Another tester said the opposite happened: a handle they'd settled on flashed "taken" for a split second before the page moved on, which was enough to make them second-guess it and type something else instead. Both reports only ever happen when someone types at a normal, fast pace; typing one deliberate character at a time in the office never reproduces either one.

Growth wants to ship a "suggestions while you type" carousel next - firing a few extra availability checks in the background for partial matches as someone types - and wants this ticket closed first, since stacking more concurrent checks on top of whatever's causing this would make it a lot more noticeable once that ships.

## Goals

- Make the code easier to maintain and extend long-term.
- The field should always reflect the check result for whichever username is currently in the box, no matter how the underlying checks happen to resolve relative to each other.
- Leave the component in a shape where firing additional concurrent checks (for the planned suggestions carousel) won't reintroduce the same glitch.

## Bonus Challenge

- Add a small "Suggestions" row that fires `checkAvailability` for 2-3 generated variants (e.g. appending digits) whenever the current username comes back taken, without those extra checks ever being able to override the main status if the person keeps typing while they're in flight.

## If you get stuck

- The bug won't show up in the existing test suite, and it's hard to catch by hand either - it depends on the relative timing of two checks that both belong to usernames the person has already typed past. Try a scratch test where you control exactly when each check's promise settles, and settle an earlier one after a later one.
- Compare what the first keystroke's check "knows" about which username it's for against what the fifth keystroke's check knows. By the time either one's result actually comes back, what (if anything) does the code check it against?
- `useEffect`'s cleanup function runs right before the effect re-runs for a new dependency value, and again on unmount. Is there anything in this component's cleanup that makes use of that moment?

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
