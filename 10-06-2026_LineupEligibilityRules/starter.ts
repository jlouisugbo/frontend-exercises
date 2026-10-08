// Fantasy lineup eligibility rules. canAddToLineup backs the weekly roster
// submission screen and has been solid for two seasons. canCompleteTrade
// got added for the new trade-review flow this spring - there wasn't a
// shared rules module yet, so it was written to match canAddToLineup's
// shape by eye rather than by calling it.

export type PlayerStatus = 'active' | 'injured_reserve' | 'suspended' | 'bye';
export type RosterSlot = 'starter' | 'bench' | 'ir_slot';

export interface RosterPlayer {
  playerId: string;
  status: PlayerStatus;
}

export function canAddToLineup(player: RosterPlayer, slot: RosterSlot): boolean {
  return handleSlotRestriction(player,slot)
}

export function canCompleteTrade(incomingPlayer: RosterPlayer, destinationSlot: RosterSlot): boolean {
  return handleSlotRestriction(incomingPlayer, destinationSlot)
}

const handleSlotRestriction = (player: RosterPlayer, slot: RosterSlot) => {
  if (player.status === 'suspended') {
    return false;
  }
  if (player.status === 'injured_reserve' && slot !== 'ir_slot') {
    return false;
  }
  return true
}
