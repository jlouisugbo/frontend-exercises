# Lookup Cache Trio

ClaimSure's internal adjuster tools kept re-fetching the same policies, claims, and members from the API on every screen transition, so three small in-memory caches went in fast - one per entity - to stop hammering it.

## Setup

```
cd 10-10-2026_LookupCacheTrio
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `PolicyCache`, `ClaimCache`, and `MemberCache`'s exported names and their current public methods (`get`, `set`, `has`, `delete`, `size`) intact - other screens already import and call them by these names. You're free to change what's underneath.

## Running Tests

```
npm test
```

## The Challenge

`PolicyCache`, `ClaimCache`, and `MemberCache` each do exactly the same job: hold a `Map` keyed by id, and let callers get, set, check, delete, and count entries. The only thing that differs between the three is which entity type they're holding.

That's worked fine so far, because there have only ever been three of these to keep in sync.

Now the product team wants adjusters to see add-on coverage details (rental car reimbursement, roadside assistance, that kind of thing) without a fresh API round trip either, which means a fourth cache - `CoverageCache` - built the exact same way as the other three. Whoever builds it is going to open `PolicyCache`, copy the whole class, rename it, and swap `Policy` for `Coverage` throughout. That's the fourth copy of identical get/set/has/delete/size logic, and nothing about the current setup would stop a fifth or sixth from showing up the same way.

## Goals

- Make the code easier to maintain and extend long-term.
- Make adding a new entity's cache a small amount of new code, not another full copy of the get/set/has/delete/size logic.
- Keep `PolicyCache`, `ClaimCache`, and `MemberCache`'s exported names and public methods intact - this isn't about changing how callers use them, just how the three are implemented underneath.

## Bonus Challenge

- Add a `getOrCreate(id, factory)` method, implemented once and available to all three caches, that returns an existing entry for `id` if there is one, or calls `factory()` to build, store, and return a new one if there isn't.

## If you get stuck

- Compare `PolicyCache`, `ClaimCache`, and `MemberCache` line by line. How much of each class is actually specific to `Policy`, `Claim`, or `Member`?
- What's the one thing every cached entity has in common that `set` actually relies on? That's the minimum a type needs to guarantee for one implementation to work for all three.
- Look for a way to write the caching logic exactly once, parameterized by the type of thing being cached, while still keeping three distinctly-named, type-safe entry points for callers to import.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
