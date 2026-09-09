export type LedgerLine = {
  accountCode: string;
  direction: 'DEBIT' | 'CREDIT';
  amountMinor: bigint;
};

export function assertBalanced(lines: LedgerLine[]): void {
  let debits = 0n;
  let credits = 0n;

  for (const line of lines) {
    if (line.amountMinor <= 0n) {
      throw new Error('Ledger amounts must be positive');
    }

    if (line.direction === 'DEBIT') {
      debits += line.amountMinor;
    } else {
      credits += line.amountMinor;
    }
  }

  if (debits !== credits) {
    throw new Error(
      `Unbalanced ledger: debits=${debits} credits=${credits}`,
    );
  }
}
