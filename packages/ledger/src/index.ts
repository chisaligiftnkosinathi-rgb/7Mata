export type LedgerLine = {
  accountCode: string;
  direction: 'DEBIT' | 'CREDIT';
  amountMinor: bigint;
};

export const STANDARD_ACCOUNTS = {
  PASSENGER_RECEIVABLE: 'PASSENGER_RECEIVABLE',
  PLATFORM_COMMISSION: '7MATA_PLATFORM_COMMISSION',
  FLEET_OWNER_PAYABLE: 'FLEET_OWNER_PAYABLE',
  DRIVER_PAYABLE: 'DRIVER_PAYABLE',
  PAYMENT_GATEWAY_CLEARING: 'PAYMENT_GATEWAY_CLEARING',
} as const;

export type SettlementSplit = {
  platformFeeMinor: bigint;
  fleetOwnerShareMinor: bigint;
  driverPayoutMinor: bigint;
  totalGrossMinor: bigint;
};

export function calculateSettlementSplit(
  totalGrossMinor: bigint,
  rates = { platformRate: 0.10, fleetRate: 0.10 }, // 10% Platform, 10% Fleet, 80% Driver
): SettlementSplit {
  const platformFeeMinor = BigInt(Math.round(Number(totalGrossMinor) * rates.platformRate));
  const fleetOwnerShareMinor = BigInt(Math.round(Number(totalGrossMinor) * rates.fleetRate));
  const driverPayoutMinor = totalGrossMinor - platformFeeMinor - fleetOwnerShareMinor;

  return {
    platformFeeMinor,
    fleetOwnerShareMinor,
    driverPayoutMinor,
    totalGrossMinor,
  };
}

export function createTripPaymentLedgerLines(
  split: SettlementSplit,
): LedgerLine[] {
  // Balanced Double-Entry lines:
  // Debit: Passenger Receivable / Gateway Clearing = totalGrossMinor
  // Credit: Platform Commission = platformFeeMinor
  // Credit: Fleet Owner Payable = fleetOwnerShareMinor
  // Credit: Driver Payable = driverPayoutMinor
  const lines: LedgerLine[] = [
    {
      accountCode: STANDARD_ACCOUNTS.PAYMENT_GATEWAY_CLEARING,
      direction: 'DEBIT',
      amountMinor: split.totalGrossMinor,
    },
    {
      accountCode: STANDARD_ACCOUNTS.PLATFORM_COMMISSION,
      direction: 'CREDIT',
      amountMinor: split.platformFeeMinor,
    },
    {
      accountCode: STANDARD_ACCOUNTS.FLEET_OWNER_PAYABLE,
      direction: 'CREDIT',
      amountMinor: split.fleetOwnerShareMinor,
    },
    {
      accountCode: STANDARD_ACCOUNTS.DRIVER_PAYABLE,
      direction: 'CREDIT',
      amountMinor: split.driverPayoutMinor,
    },
  ];

  assertBalanced(lines);
  return lines;
}

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
