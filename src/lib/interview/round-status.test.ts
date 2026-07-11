import { describe, expect, it } from 'vitest';
import { isRoundViewOnly } from './round-status';

describe('isRoundViewOnly', () => {
  it('returns true for a completed round', () => {
    expect(isRoundViewOnly('completed', 'in_progress')).toBe(true);
  });

  it('returns true for a skipped round', () => {
    expect(isRoundViewOnly('skipped', 'in_progress')).toBe(true);
  });

  it('returns false for an active round in an active session', () => {
    expect(isRoundViewOnly('in_progress', 'in_progress')).toBe(false);
    expect(isRoundViewOnly('pending', 'in_progress')).toBe(false);
    expect(isRoundViewOnly('in_progress', 'paused')).toBe(false);
  });

  // Legacy data: rounds finished via AI [ROUND_COMPLETE] were never marked
  // completed in the DB, so a completed session must always be view-only.
  it('returns true for any round once the session is completed', () => {
    expect(isRoundViewOnly('in_progress', 'completed')).toBe(true);
    expect(isRoundViewOnly('pending', 'completed')).toBe(true);
    expect(isRoundViewOnly('completed', 'completed')).toBe(true);
  });

  it('returns false when round is missing', () => {
    expect(isRoundViewOnly(undefined, 'completed')).toBe(true);
    expect(isRoundViewOnly(undefined, 'in_progress')).toBe(false);
  });
});
