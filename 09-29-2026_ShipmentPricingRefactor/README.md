# Shipment Pricing Refactor

You're the newest engineer on the ops tooling team at a small logistics startup. The shipment pricing module below has been humming along in production for over a year, bolted onto by three different people who each just needed to "add one more thing." It works, tests pass, and nobody wants to be the one who breaks it — which is exactly why it's your problem now.

## Setup

```
cd 09-29-2026_ShipmentPricingRefactor
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `calculateShippingCost`, `getEstimatedDeliveryDays`, `getCarrierDisplayName`, and `getShipmentSummary` exported from `starter.ts` with their current parameter meaning (an order, an express flag, a fragile flag). You're free to reshape how they compute their answer and to change their internal representation entirely — the test seam at the top of the test file is where you reconcile any signature changes, not the individual test cases.
- Don't hardcode test-specific values into the pricing logic just to make a test pass. The logic should still generalize correctly to a carrier or scenario the tests don't happen to cover.

## Running Tests

```
npm test
```

## The Challenge

`starter.ts` calculates a shipping quote, an estimated delivery window, and a display label for a shipment, based on which carrier is handling it. Every one of those three functions needs to know something different about each carrier — UPS prices differently than FedEx, DHL ships faster internationally than USPS — so each function has grown its own `if / else if` chain that checks the same four carrier codes, in the same order, one function at a time.

It's not broken. It's also not fun to work in. Every time someone adds a carrier, they have to remember to touch three separate functions, get the branch order right in each one, and hope they didn't typo a carrier code somewhere along the way — nothing currently stops `'fedx'` from silently falling through to the generic "unknown carrier" branch instead of raising a flag. The rate numbers themselves — base rate, per-kilo rate, international surcharge, express multiplier, fragile fee — are scattered as inline literals inside each branch, so answering a simple question like "what's FedEx's international surcharge again?" means reading code, not looking up data.

Ops just told you they're onboarding a fifth carrier, Amazon Logistics, with its own rate card, next sprint — and a regional courier is already being discussed as a sixth. Before you commit to that timeline, take a pass at the module so that adding a carrier becomes a small, low-risk change instead of a hunt across the file.

## Goals

- Make the code easier to maintain and extend long-term.
- Adding a new carrier should mean adding data in one place, not editing conditional logic spread across three functions.
- Make an invalid or mistyped carrier code impossible (or at least much harder) to pass silently through the system.

## Bonus Challenge

Ops also wants a "heavy package" surcharge: any shipment over 20kg should add a flat, per-carrier heavy-handling fee on top of everything else. Add it in a way that doesn't require introducing another parallel `if / else if` chain.

## If you get stuck

- Count how many places in the file know the full list of valid carrier codes. That number should make you suspicious.
- Look at what actually varies per carrier — rate, per-kilo cost, international surcharge, express multiplier, fragile fee, transit days, display name — versus what's genuinely *logic* (how those numbers get combined). Could the per-carrier part live in a single lookup structure instead of being re-derived in every function?
- TypeScript's union types can turn "not a real carrier" into a compile-time error instead of a silent runtime fallback. What would `order.carrier`'s type need to look like for that?
