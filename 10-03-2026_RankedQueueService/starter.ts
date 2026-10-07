// Ranked matchmaking queue for Nova Arena. The VIP "jump to front" tool
// got bolted on last week so support could demo a match live at the
// conference booth without waiting behind a full queue - there wasn't
// time to touch MatchmakingQueue itself that day.

export interface QueuedPlayer {
  playerId: string;
  skillRating: number;
  joinedAt: number; // epoch ms
}

export class MatchmakingQueue {
  private readonly maxSize: number;

  // Exposed directly so the VIP tool (and anything else) can reach in and
  // adjust position without going through enqueue/dequeue.
  players: QueuedPlayer[] = [];

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  enqueue(player: QueuedPlayer): boolean {
    if (this.players.length >= this.maxSize) {
      return false;
    }
    if (this.players.some((p) => p.playerId === player.playerId)) {
      return false;
    }
    this.players.push(player);
    return true;
  }

  dequeue(): QueuedPlayer | undefined {
    return this.players.shift();
  }

  get size(): number {
    return this.players.length;
  }
}

// Support's VIP tool: put a player at the very front of the line so they
// get matched on the next tick, skipping the wait.
export function boostToFront(queue: MatchmakingQueue, player: QueuedPlayer): void {
  queue.players.unshift(player);
}
