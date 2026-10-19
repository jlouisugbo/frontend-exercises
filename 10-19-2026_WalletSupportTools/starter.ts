// Wallet/ledger model for Pocketbook's budgeting app. postTransaction is
// deliberately careful about what it lets through - everything else here
// got bolted on by support tooling under separate, smaller deadlines.

export type TransactionType = 'credit' | 'debit';

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number; // always positive; direction comes from `type`
  memo: string;
  postedAt: string; // ISO timestamp
}

/**
 * Wallet tracks a customer's running balance and transaction history.
 * `postTransaction` is the one place that's supposed to move money:
 * it refuses to post to a frozen wallet, refuses a non-positive amount,
 * and refuses a debit that would push the balance past `overdraftLimit`.
 */
export class Wallet {
  public balance: number;
  public transactions: Transaction[] = [];
  public frozen = false; // set by fraud review; postTransaction already checks this

  private nextId = 1;

  constructor(
    public readonly accountId: string,
    openingBalance = 0,
    public readonly overdraftLimit = 500
  ) {
    this.balance = openingBalance;
  }

  postTransaction(type: TransactionType, amount: number, memo: string): Transaction {
    if (this.frozen) {
      throw new Error(`Wallet ${this.accountId} is frozen - see fraud review before posting.`);
    }

    if (amount <= 0) {
      throw new Error('Transaction amount must be positive.');
    }

    const delta = type === 'credit' ? amount : -amount;
    if (this.balance + delta < -this.overdraftLimit) {
      throw new Error('Transaction would exceed the overdraft limit.');
    }

    const txn: Transaction = {
      id: this.nextId++,
      type,
      amount,
      memo,
      postedAt: new Date().toISOString(),
    };
    this.transactions.push(txn);
    this.balance += delta;
    return txn;
  }
}

/**
 * Added last sprint for the "fat-fingered the amount" support ticket: lets a
 * rep undo a customer's most recent transaction from the support console.
 * Shipped same-day ahead of a demo - reaches straight into the wallet's own
 * fields instead of adding a method to `Wallet`, which felt like the fast
 * path at the time.
 */
export function undoLastTransaction(wallet: Wallet): Transaction | null {
  const last = wallet.transactions[wallet.transactions.length - 1];
  if (!last) {
    return null;
  }

  wallet.transactions.splice(wallet.transactions.length - 1, 1);
  wallet.balance += last.type === 'credit' ? -last.amount : last.amount;
  return last;
}

/**
 * Backfills transactions from the bank's reconciliation export after a
 * sync hiccup. The export doesn't carry our internal transaction ids, so
 * this stamps its own and pushes straight onto the wallet - same shortcut
 * as `undoLastTransaction` above.
 */
export function importTransactions(
  wallet: Wallet,
  rows: { type: TransactionType; amount: number; memo: string }[]
): void {
  for (const row of rows) {
    wallet.transactions.push({
      id: wallet.transactions.length + 1000,
      type: row.type,
      amount: row.amount,
      memo: row.memo,
      postedAt: new Date().toISOString(),
    });
    wallet.balance += row.type === 'credit' ? row.amount : -row.amount;
  }
}
