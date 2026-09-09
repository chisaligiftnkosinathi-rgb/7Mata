export type PricingInput = {
  distanceKm: number;
  durationMinutes: number;
  baseMinor: bigint;
  perKmMinor: bigint;
  perMinuteMinor: bigint;
  minimumFareMinor: bigint;
  multiplier: number;
};

export type FareBreakdown = {
  baseMinor: bigint;
  distanceMinor: bigint;
  timeMinor: bigint;
  subtotalMinor: bigint;
  multiplier: number;
  totalMinor: bigint;
};

export function calculateFare(input: PricingInput): FareBreakdown {
  const distanceMinor =
    BigInt(Math.round(input.distanceKm * Number(input.perKmMinor)));

  const timeMinor =
    BigInt(Math.round(input.durationMinutes * Number(input.perMinuteMinor)));

  const subtotal =
    input.baseMinor + distanceMinor + timeMinor;

  const multiplied =
    BigInt(Math.round(Number(subtotal) * input.multiplier));

  const totalMinor =
    multiplied < input.minimumFareMinor
      ? input.minimumFareMinor
      : multiplied;

  return {
    baseMinor: input.baseMinor,
    distanceMinor,
    timeMinor,
    subtotalMinor: subtotal,
    multiplier: input.multiplier,
    totalMinor,
  };
}
