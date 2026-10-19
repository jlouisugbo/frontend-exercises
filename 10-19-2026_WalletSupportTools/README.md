# Wallet Support Tools

Pocketbook's `Wallet` class tracks a customer's running balance and transaction history, and `postTransaction` is deliberately careful about what it lets through. A couple of support-side features got bolted on top of it fast, and now there's a fraud-review feature on the roadmap that needs all of them to actually agree on the rules.

## Setup

```
cd 10-19-2026_WalletSupportTools
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `Wallet`'s constructor signature (`accountId`, `openingBalance`, `overdraftLimit`) and `postTransaction`'s three checks - frozen, positive amount, overdraft limit - and their order intact. You're free to change anything else about how `Wallet` exposes its state and how `undoLastTransaction`/`importTransactions` get at it.

## Running Tests

```
npm test
```

## The Challenge

`postTransaction` is the one place in Pocketbook that's supposed to move money in or out of a wallet. It won't post to a frozen wallet, won't accept a non-positive amount, and won't let a debit push the balance past the configured overdraft limit. Every transaction that goes through it ends up in `transactions`, and the balance always matches what's in that list.

Two features got added on top of this for the support team, both under a same-day deadline: `undoLastTransaction`, so a rep can reverse a customer's last transaction from the support console, and `importTransactions`, used by the nightly reconciliation job to backfill transactions after a bank-sync hiccup. Both need to read and adjust `balance` and `transactions`, and since those fields are sitting right there on the `Wallet` instance, both reach in and change them directly instead of going through `postTransaction`. It's worked fine so far - every wallet anyone has tested with has been in good standing, comfortably under its overdraft limit, with amounts that are always positive.

Fraud review is adding a freeze step: once a wallet is flagged, nothing should be able to move money through it until a reviewer clears it. The `frozen` flag already exists on `Wallet`, and `postTransaction` already respects it. But a rep hitting undo on a flagged account, or the reconciliation job backfilling that account's missed transactions, would still change `balance` and `transactions` without either of them ever looking at `frozen` - freezing a wallet wouldn't actually stop money from moving through it, just from moving through one particular door.

## Goals

- Make the code easier to maintain and extend long-term.
- Make sure a frozen wallet can't have its balance or transaction history changed by any of the three entry points - posting, undo, or import - with that rule enforced in one place, not copied into each one.
- Keep `postTransaction`'s existing checks doing the same job they do today for ordinary posting.

## Bonus Challenge

- Also close the gap where `importTransactions` can backfill a negative or zero amount, or push a wallet's balance past its overdraft limit - neither of which `postTransaction` would ever allow.

## If you get stuck

- List every place in this file that changes `wallet.balance` or `wallet.transactions`. How many of them are `postTransaction`?
- If you froze a wallet right now and then called `undoLastTransaction` on it, what would actually stop the balance from changing?
- What would it look like for `balance` and `transactions` to only ever change as a side effect of calling one particular method, no matter which feature is triggering it?

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
