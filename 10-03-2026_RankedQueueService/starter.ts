// Ranked matchmaking queue for Nova Arena. The VIP "jump to front" tool
// got bolted on last week so support could demo a match live at the
// conference booth without waiting behind a full queue - there wasn't
// time to touch MatchmakingQueue itself that day.

export interface QueuedPlayer {
  playerId: string;
  skillRating: number;
  joinedAt: number; // epoch ms
  partyId?: number;
}

export class MatchmakingQueue {
  private readonly maxSize: number;

  // Exposed directly so the VIP tool (and anything else) can reach in and
  // adjust position without going through enqueue/dequeue.
  private players: QueuedPlayer[] = [];

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  enqueue(player: QueuedPlayer): boolean {
    if(!this.spaceToAddPlayer()) return false
    if(this.playerInQueue(player) !== -1) return false
    this.players.push(player);
    return true;
  }

  dequeue(): QueuedPlayer | undefined {
    return this.players.shift();
  }

  get size(): number {
    return this.players.length;
  }

  get remainingSize(): number { 
    return this.maxSize - this.players.length
  }

  private spaceToAddPlayer(): boolean {
    if (this.players.length >= this.maxSize) return false
    return true
  }

  private playerInQueue(player: QueuedPlayer): number { 
    const index = this.players.findIndex(p => p.playerId === player.playerId) 
    return index 
  }

  boostToFront(player: QueuedPlayer): boolean {
    let index = this.playerInQueue(player)
    if (index !== -1) {
      const [existingPlayer] = this.players.splice(index, 1)
      this.players.unshift(existingPlayer)
    } else {
      if(!this.spaceToAddPlayer()) return false
      this.players.unshift(player)
    }
    return true
  }
}

export function boostToFront(queue: MatchmakingQueue, player: QueuedPlayer): void {
  queue.boostToFront(player)
}

export function queueParty(queue: MatchmakingQueue, party: QueuedPlayer[]): void {
  if (queue.remainingSize < party.length) return 
  for (const player of party) { 
    queue.enqueue(player)
  }
}
