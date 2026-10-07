# Episode Preview Rail

You're building a piece of StreamNest, a streaming platform's show page. Viewers browse a show's episode rail - by clicking a thumbnail or by arrowing along it with the keyboard - to preview an episode's synopsis and runtime before committing to hit play.

## Setup

```
cd 10-07-2026_EpisodePreviewRail
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `EpisodePreviewRail` exported from `starter.tsx` with its current props (`episodes`, `fetchEpisodePreview`) and its outward behavior - clicking an episode or pressing the arrow keys moves focus along the rail and loads that episode's preview, with a loading state while the fetch is in flight and an error state if it fails. You're free to restructure the internals (the handler, a ref, a request id, whatever you like) - the seam at the top of the test file is where you reconcile any prop or markup changes, not the individual test cases.
- Don't "fix" this by dropping keyboard navigation - it shipped to satisfy an accessibility review, and the panel needs to end up right regardless of how fast someone arrows along the rail or how the resulting fetches happen to resolve relative to each other.

## Running Tests

```
npm test
```

## The Challenge

`EpisodePreviewRail` renders a show's episodes in a horizontal list. Clicking an episode, or focusing it with the arrow keys, calls the injected `fetchEpisodePreview(episodeId)` and renders whatever synopsis and runtime come back underneath the rail.

A few people on the design team doing a quick pass through a season - arrowing right rapidly to skim every episode's blurb - have reported the preview card occasionally settles on text that doesn't match the episode highlighted as current: a synopsis and runtime that belong to an episode they arrowed past a moment ago, sitting under the title of the episode the rail says is now focused. Nobody's been able to pin it to a specific show or a specific number of key presses - it just happens "sometimes" when you move through episodes quickly.

Content ops wants to wire the same rail into a "shuffle preview" feature for the homepage, which would auto-advance the focused episode every second or two to show off a season without anyone touching a key. Nobody wants to ship that until the mismatch is understood, since auto-advancing it just means more fetches landing close together, with no user keypress to slow them down.

## Goals

- Make the code easier to maintain and extend long-term.
- The preview card should always display the synopsis and runtime for whichever episode the rail currently shows as focused, no matter how quickly someone arrows through episodes or how the resulting fetches happen to resolve relative to each other.
- Leave the fetch-and-render logic in a shape where wiring up a faster, automatic version of the same "move focus, load a preview" flow doesn't make the problem worse.

## Bonus Challenge

- Add a lightweight in-memory cache keyed by `episodeId`, so arrowing back to an episode the rail already has a recent preview for shows it instantly while a fresh read comes in behind it - without ever letting a stale preview for an episode someone's since moved away from land in the card.

## If you get stuck

- The existing test suite won't catch this one - it depends on the relative timing of two preview loads for two different episodes, which is hard to force without controlling exactly when each one's promise settles.
- Clicking an episode and arrowing to one both end up calling the same function to load a preview. What does that function actually know about which episode it was called for, by the time its promise resolves?
- Compare what a given fetch call "knows" about which episode it was for against what the code actually checks when that fetch's result comes back.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
