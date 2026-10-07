import { describe, it, expect } from 'vitest';
import { canAddToLineup, canCompleteTrade, type RosterPlayer } from './starter';

// --- Seam ---------------------------------------------------------------
// This is the only place that knows how a RosterPlayer gets built for a
// test. If you refactor how eligibility is checked (a shared rules module,
// whatever), update ONLY the helper in this block - the test cases below
// should keep working unchanged as long as canAddToLineup/canCompleteTrade
// keep the same observable input/output shape.

function player(status: RosterPlayer['status']): RosterPlayer {
  return { playerId: 'p1', status };
}
// -------------------------------------------------------------------------

describe('canAddToLineup', () => {
  it('allows an active player into a starter slot', () => {
    expect(canAddToLineup(player('active'), 'starter')).toBe(true);
  });

  it('blocks a suspended player from any slot', () => {
    expect(canAddToLineup(player('suspended'), 'bench')).toBe(false);
  });

  it('allows an injured_reserve player into the ir_slot', () => {
    expect(canAddToLineup(player('injured_reserve'), 'ir_slot')).toBe(true);
  });

  it('blocks an injured_reserve player from a starter slot', () => {
    expect(canAddToLineup(player('injured_reserve'), 'starter')).toBe(false);
  });

  it('allows a bye-week player into the bench', () => {
    expect(canAddToLineup(player('bye'), 'bench')).toBe(true);
  });
});

describe('canCompleteTrade', () => {
  it('allows trading in an active player to a starter slot', () => {
    expect(canCompleteTrade(player('active'), 'starter')).toBe(true);
  });

  it('blocks trading in a suspended player', () => {
    expect(canCompleteTrade(player('suspended'), 'bench')).toBe(false);
  });

  it('currently allows trading an injured_reserve player straight into a starter slot', () => {
    expect(canCompleteTrade(player('injured_reserve'), 'starter')).toBe(true);
  });
});
