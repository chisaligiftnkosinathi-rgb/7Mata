import { describe, expect, it } from 'vitest';
import { canTransition } from '@7mata/domain';

describe('Trip state machine', () => {
  it('allows valid transition', () => {
    expect(canTransition('REQUESTED', 'MATCHING')).toBe(true);
  });

  it('rejects invalid transition', () => {
    expect(canTransition('REQUESTED', 'TRIP_COMPLETED')).toBe(false);
  });
});
