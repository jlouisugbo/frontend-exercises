# Semester Grades Panel

You're on Pathwise's advising team, building a panel academic advisors use during drop-in sessions: picking which semester of a student's transcript to pull up while the student is sitting across the desk.

## Setup

```
cd 10-05-2026_SemesterGradesPanel
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `SemesterGradesPanel` exported from `starter.tsx` with its current props (`semesters`, `fetchSemesterGrades`) and its outward behavior - clicking a semester tab loads that semester's grades, with a loading state while the fetch is in flight and an error state if it fails. You're free to restructure the internals (the reducer, a ref, a request id, whatever you like) - the seam at the top of the test file is where you reconcile any prop or markup changes, not the individual test cases.
- Don't "fix" this by disabling the tabs while a fetch is in flight - advisors flip quickly between semesters during a live session while the student is right there, and the panel should still end up right no matter how fast they click through.

## Running Tests

```
npm test
```

## The Challenge

`SemesterGradesPanel` renders a row of semester tabs and, when one is clicked, calls the injected `fetchSemesterGrades(semesterId)` to load that semester's courses and letter grades into the panel below. The fetch lifecycle is managed through a small reducer - loading, loaded, error - that got pulled together last sprint so it's one clean set of transitions instead of four separate pieces of state.

A couple of advisors have reported something odd during busier sessions: they'll click through a student's last few semesters quickly, comparing trends before making a recommendation, and for a moment (sometimes it sticks) the grades shown don't match the semester tab that's highlighted as selected. It only ever comes up when they're clicking through quickly - never when they wait for one semester to load before clicking the next.

Pathwise wants to ship a side-by-side "compare two semesters" view next, mounting two of these panels at once so an advisor can eyeball a trend across terms - twice the concurrent fetches in flight, twice the chances for one to land out of order. Whatever's behind the mismatch needs to be sorted out before that reuse ships, or it'll just show up twice as often.

## Goals

- Make the code easier to maintain and extend long-term.
- The panel should always display the grades for whichever semester tab is currently selected, no matter how the underlying fetches happen to resolve relative to each other.
- Leave the fetch-and-dispatch logic in a shape where mounting a second, independent instance of it (for the upcoming compare view) won't double the chance of the same glitch.

## Bonus Challenge

- Add a lightweight in-memory cache keyed by `semesterId`, so re-selecting a previously-seen semester renders instantly - without ever letting a slow fetch for a semester the advisor has since clicked away from land in the panel.

## If you get stuck

- The existing test suite won't catch this one - it depends on the relative timing of two fetches for two different semesters, which is hard to force without controlling exactly when each one's promise settles.
- Compare what the first tab click's fetch "knows" about which semester it was for against what the code actually checks when that fetch's result comes back.
- The fetch is kicked off directly inside the click handler, and the result lands via a dispatch into the reducer - there's no dependency array or cleanup function here to lean on. Whatever guard is needed has to live somewhere else: the handler, the action itself, or the reducer.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
