# Payroll Event Processor

Flexstaff runs contractor payroll off a stream of `PayrollEvent`s - hires, terminations, bonuses, and now corrections - each translated into a `PayrollLineItem` that lands on someone's pay stub. `toLineItem` is the one function standing between an event and real money moving.

## Setup

```
cd 10-04-2026_PayrollEventProcessor
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `toLineItem` exported with the same name and the same `PayrollLineItem` output shape (`employeeId`, `description`, `amountCents`). You're free to reshape `PayrollEvent` itself however you like.
- Don't just add validation that throws on "bad" events - the goal isn't to reject malformed data at runtime, it's to make the kind of event that shouldn't exist harder to construct in the first place.

## Running Tests

```
npm test
```

## The Challenge

`PayrollEvent` has grown one field at a time: `startingSalaryCents` for hires, `severanceCents` for terminations, `bonusAmountCents` and `bonusReason` for bonuses, `correctedFieldName` and `correctedValueCents` for the correction type finance asked for a sprint after that. `toLineItem` reads whichever fields matter for the event's `type` and ignores the rest.

It's worked fine so far, but a near-miss last month got people nervous: someone building a one-off script to backfill missing severance data accidentally constructed a `hire` event that also had `severanceCents` set on it (copy-pasted from a termination event template), and nothing - not the type checker, not a lint rule, not a test - caught it before it got close to an actual payroll run. It happened to get caught in manual review that time.

Now the payroll product is adding a `rehire` event type next sprint, for contractors who left and came back within 90 days at a prorated starting salary. Whoever picks that up is going to add `'rehire'` to the type union and probably a new optional field or two, the same way every event type before it got added - and `toLineItem`'s current structure means that until someone remembers to add a matching branch, a `rehire` event will quietly fall into whichever branch runs by default, producing a line item with the wrong description and the wrong amount, for an event type the code doesn't actually know how to handle yet.

## Goals

- Make the code easier to maintain and extend long-term.
- An event that doesn't belong to a given type (wrong fields present, required fields missing) should be hard or impossible to construct, rather than just handled gracefully at runtime.
- When the next event type is added, forgetting to teach `toLineItem` about it should be something the compiler catches, not something that ships.

## Bonus Challenge

- Sketch out what adding the `rehire` type would look like after your refactor - what has to change, and what (if anything) the compiler forces you to touch.

## If you get stuck

- Look at which fields on `PayrollEvent` are actually relevant for a given `type`, versus which ones just happen to be sitting there unused. What do the unused ones cost you?
- `toLineItem`'s last branch has a comment explaining why it doesn't check for a specific type. What happens to that comment's reasoning the day a fifth event type exists?
- TypeScript has a way to make "I've handled every possible case" something the compiler verifies instead of something a comment promises.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
