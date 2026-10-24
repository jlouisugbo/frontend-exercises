# Usage Insights Service

BrightGrid's account dashboard shows customers a "How am I doing this month?" card: total usage, estimated cost, peak usage hour, and whether they're running hot against a baseline. All of it is computed by `UsageInsightsService`, and all of it comes from Acme Meter Co., the only meter-data vendor BrightGrid has ever needed to deal with.

## Setup

```
cd 10-24-2026_UsageInsightsService
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `UsageInsightsService`'s three public methods (`getDailySummary`, `getPeakHour`, `isAboveBaseline`) and their signatures intact, along with the shape of `DailySummary`, `IntervalReading`, and `Tariff`. You're free to change anything about how the service gets its meter-data dependency and how `AcmeMeterGateway` fits into that.

## Running Tests

```
npm test
```

## The Challenge

`UsageInsightsService` has three jobs: add up a day's interval readings and price them at the account's tariff rate, find the hour with the highest reading, and flag whether a day's total usage is above some baseline. All three methods lean on `AcmeMeterGateway` to get the readings and tariff in the first place, and all three have worked fine since launch - every account BrightGrid has ever served has been metered by Acme, so nobody building this had a reason to think about it any other way.

That's about to change. BrightGrid is acquiring Riverbend Power, a small regional co-op, and Riverbend's accounts are already wired up to a different metering vendor, GridLink, with its own client and its own API shape - readings and rate lookups work differently than Acme's. Engineering wants `UsageInsightsService` to serve both Acme-metered and GridLink-metered accounts side by side, without forking the class or teaching every method a second vendor's quirks. Separately, QA would like to unit-test the usage math itself - the summing, the peak-finding, the baseline comparison - against made-up readings, instead of only the two fixed accounts Acme's fixture happens to know about.

Both of those turn out to be the same problem: there's currently no way to hand `UsageInsightsService` a different source of readings and tariffs than the one it already has baked in, whether that source is GridLink's real API or a test double with numbers you made up.

## Goals

- Make the code easier to maintain and extend long-term.
- Let `UsageInsightsService` work against either `AcmeMeterGateway` or a GridLink-shaped source, chosen per account, without duplicating or forking the three insight methods.
- Make it possible to unit-test the usage math against arbitrary reading data, not just the two accounts baked into Acme's fixture.

## Bonus Challenge

- Sketch a minimal `GridLinkMeterGateway` (a stub returning a couple of made-up readings is fine) that could stand in for `AcmeMeterGateway` without `UsageInsightsService`'s methods needing to know which one they're talking to.

## If you get stuck

- Search this file for every place the word "Acme" or `AcmeMeterGateway` shows up outside its own class. How many of those would you have to touch to introduce a second vendor?
- If you wanted to test `getPeakHour` against three readings you made up yourself, what's stopping you from doing that right now without touching `acct-100`'s fixture data?
- What would it look like for `UsageInsightsService` to receive whatever it talks to for readings and tariffs, instead of creating it itself?

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
