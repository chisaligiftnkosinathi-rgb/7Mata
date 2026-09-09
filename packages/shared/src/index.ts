import { randomUUID } from 'node:crypto';

export const id = () => randomUUID();

export const now = () => new Date();

export function moneyMinorUnits(value: number): bigint {
  if (!Number.isInteger(value)) {
    throw new Error('Money must be represented in integer minor units');
  }
  return BigInt(value);
}
