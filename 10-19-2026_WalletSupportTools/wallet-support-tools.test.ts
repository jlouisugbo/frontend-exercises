import { describe, it, expect } from 'vitest';
import { Wallet, undoLastTransaction, importTransactions, type TransactionType } from './starter';

// --- Seam ---------------------------------------------------------------
// This is the only place that knows how a Wallet gets constructed and how
// posting/undo/import get invoked. If you refactor (move undo/import onto
// Wallet, change how frozen/overdraft are enforced, etc.), update ONLY the
// helpers below - the test cases underneath should keep working unchanged
// as long as the observable balance/transaction behavior stays the same
// shape.

function makeWallet(openingBalance = 0, overdraftLimit = 500, accountId = 'acct-1'): Wallet {
  return new Wallet(accountId, openingBalance, overdraftLimit);
}

function freeze(wallet: Wallet): void {
  wallet.frozen = true;
}

function post(wallet: Wallet, type: TransactionType, amount: number, memo = 'txn') {
  return wallet.postTransaction(type, amount, memo);
}

function undo(wallet: Wallet) {
  return undoLastTransaction(wallet);
}

function doImport(wallet: Wallet, rows: { type: TransactionType; amount: number; memo: string }[]) {
  importTransactions(wallet, rows);
}

function balanceFor(wallet: Wallet): number {
  return wallet.balance;
}

function transactionCountFor(wallet: Wallet): number {
  return wallet.transactions.length;
}
// -------------------------------------------------------------------------

describe('postTransaction', () => {
  it('refuses to post to a frozen wallet', () => {
    const wallet = makeWallet(100);
    freeze(wallet);

    expect(() => post(wallet, 'credit', 50)).toThrow(/frozen/i);
  });

  it('refuses a non-positive amount', () => {
    const wallet = makeWallet(100);

    expect(() => post(wallet, 'debit', 0)).toThrow(/positive/i);
  });

  it('posts a credit and increases the balance', () => {
    const wallet = makeWallet(100);

    const txn = post(wallet, 'credit', 40, 'paycheck');

    expect(txn.type).toBe('credit');
    expect(balanceFor(wallet)).toBe(140);
    expect(transactionCountFor(wallet)).toBe(1);
  });

  it('posts a debit and decreases the balance', () => {
    const wallet = makeWallet(100);

    const txn = post(wallet, 'debit', 30, 'groceries');

    expect(txn.type).toBe('debit');
    expect(balanceFor(wallet)).toBe(70);
    expect(transactionCountFor(wallet)).toBe(1);
  });

  it('refuses a debit that would exceed the overdraft limit', () => {
    const wallet = makeWallet(0, 500);

    expect(() => post(wallet, 'debit', 600)).toThrow(/overdraft/i);
    expect(balanceFor(wallet)).toBe(0);
  });
});

describe('undoLastTransaction', () => {
  it('returns null when there is nothing to undo', () => {
    const wallet = makeWallet(100);

    expect(undo(wallet)).toBeNull();
    expect(balanceFor(wallet)).toBe(100);
  });

  it('reverses the most recent credit', () => {
    const wallet = makeWallet(100);
    post(wallet, 'credit', 40, 'paycheck');

    const undone = undo(wallet);

    expect(undone?.memo).toBe('paycheck');
    expect(balanceFor(wallet)).toBe(100);
    expect(transactionCountFor(wallet)).toBe(0);
  });

  it('reverses the most recent debit', () => {
    const wallet = makeWallet(100);
    post(wallet, 'debit', 30, 'groceries');

    const undone = undo(wallet);

    expect(undone?.memo).toBe('groceries');
    expect(balanceFor(wallet)).toBe(100);
    expect(transactionCountFor(wallet)).toBe(0);
  });
});

describe('importTransactions', () => {
  it('appends a mix of credit and debit rows and adjusts the balance for each', () => {
    const wallet = makeWallet(100);

    doImport(wallet, [
      { type: 'credit', amount: 25, memo: 'bank sync: refund' },
      { type: 'debit', amount: 10, memo: 'bank sync: fee' },
    ]);

    expect(transactionCountFor(wallet)).toBe(2);
    expect(balanceFor(wallet)).toBe(115);
  });
});
