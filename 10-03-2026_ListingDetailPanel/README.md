# Listing Detail Panel

You're on Realta's search team, shipping the new split-view listings browser: a scrollable list of cards on the left, and a detail panel on the right that loads whichever listing the person most recently clicked.

## Setup

```
cd 10-03-2026_ListingDetailPanel
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `ListingDetailPanel` exported from `starter.tsx` with its current props (`listings`, `fetchListingDetail`) and its outward behavior - clicking a card loads that listing's detail into the panel, with a loading state while the fetch is in flight and an error state if it fails. You're free to restructure the internals (a reducer, a ref, a request-id, whatever you like) - the seam at the top of the test file is where you reconcile any prop or markup changes, not the individual test cases.
- Don't "fix" this by disabling the list while a fetch is in flight, or by blocking clicks until the previous fetch settles - people should be able to click through several listings quickly while they're browsing, and the panel should still end up right.

## Running Tests

```
npm test
```

## The Challenge

`ListingDetailPanel` renders a list of listing cards and, when one is clicked, calls the injected `fetchListingDetail(listingId)` to load that listing's full detail - price, square footage, bedrooms, description - into the panel on the right. It's a small component: no router, no per-listing page, just a click handler that kicks off a fetch and renders whatever comes back.

A support ticket came in that's hard to reproduce on demand: someone said they clicked through a few nearby listings while comparing prices, and the panel ended up showing the wrong address - one they'd already clicked past - with the correct one still highlighted in the list on the left. It only ever happens when someone clicks quickly between a couple of listings, never when clicking one at a time and waiting for each to load.

Realta's mobile team wants to add hover-prefetching next - firing `fetchListingDetail` as soon as a card is hovered, before the click even lands, so the detail feels instant once clicked. That's going to mean a lot more of these fetches in flight at once, all racing each other, so whatever's causing the mismatched address needs to be sorted out before that ships.

## Goals

- Make the code easier to maintain and extend long-term.
- The panel should always reflect the fetch result for whichever listing is currently selected, no matter how the underlying fetches happen to resolve relative to each other.
- Leave the component in a shape where firing additional concurrent fetches (for the planned hover-prefetch) won't reintroduce the same glitch.

## Bonus Challenge

- Add a `prefetchListingDetail(listingId)` call triggered on hover (`onMouseEnter`) that warms a cache keyed by listing id, so a click on an already-hovered card can render instantly from the cache - without letting a slow hover-triggered fetch for a listing the person never clicked ever appear in the panel.

## If you get stuck

- The bug won't show up in the existing test suite, and it's hard to catch by hand either - it depends on the relative timing of two fetches for two different listings. Try a scratch test where you control exactly when each fetch's promise settles, and settle an earlier click's fetch after a later click's.
- Compare what the first click's fetch "knows" about which listing it's for against what the second click's fetch knows. By the time either one's result actually comes back, what (if anything) does the code check it against?
- The fetch is kicked off directly inside the click handler rather than in a `useEffect` - so there's no dependency array and no cleanup function here. Whatever guards against the stale result has to live somewhere else.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
