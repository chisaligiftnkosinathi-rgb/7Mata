export const TRIP_STATES = [
  'REQUESTED',
  'MATCHING',
  'OFFERED',
  'ACCEPTED',
  'DRIVER_ARRIVING',
  'DRIVER_ARRIVED',
  'TRIP_STARTED',
  'TRIP_COMPLETED',
  'CANCELLED',
  'FAILED',
] as const;

export type TripState = typeof TRIP_STATES[number];

const transitions: Record<TripState, readonly TripState[]> = {
  REQUESTED: ['MATCHING', 'CANCELLED'],
  MATCHING: ['OFFERED', 'CANCELLED', 'FAILED'],
  OFFERED: ['ACCEPTED', 'MATCHING', 'CANCELLED'],
  ACCEPTED: ['DRIVER_ARRIVING', 'CANCELLED'],
  DRIVER_ARRIVING: ['DRIVER_ARRIVED', 'CANCELLED'],
  DRIVER_ARRIVED: ['TRIP_STARTED', 'CANCELLED'],
  TRIP_STARTED: ['TRIP_COMPLETED', 'FAILED'],
  TRIP_COMPLETED: [],
  CANCELLED: [],
  FAILED: [],
};

export function canTransition(
  from: TripState,
  to: TripState,
): boolean {
  return transitions[from].includes(to);
}
