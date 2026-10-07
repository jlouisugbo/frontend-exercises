import { describe, it, expect } from 'vitest';
import { MatchmakingQueue, boostToFront, type QueuedPlayer } from './starter';

// --- Seam ---------------------------------------------------------------
// This is the only place that knows how a queue and its players get built.
// If you refactor MatchmakingQueue's internals (private storage, a Set for
// membership, whatever), update ONLY the helpers in this block - the test
// cases below should keep working unchanged as long as enqueue/dequeue/size
// and boostToFront's observable behavior stay the same shape.

function makeQueue(maxSize = 3): MatchmakingQueue {
  return new MatchmakingQueue(maxSize);
}

function makePlayer(overrides: Partial<QueuedPlayer> = {}): QueuedPlayer {
  return {
    playerId: 'p1',
    skillRating: 1200,
    joinedAt: Date.now(),
    ...overrides,
  };
}

function playerIds(queue: MatchmakingQueue): string[] {
  return queue.players.map((p) => p.playerId);
}
// -------------------------------------------------------------------------

describe('MatchmakingQueue', () => {
  it('enqueues players in join order up to maxSize', () => {
    const queue = makeQueue(2);

    expect(queue.enqueue(makePlayer({ playerId: 'a' }))).toBe(true);
    expect(queue.enqueue(makePlayer({ playerId: 'b' }))).toBe(true);

    expect(playerIds(queue)).toEqual(['a', 'b']);
    expect(queue.size).toBe(2);
  });

  it('rejects enqueueing past maxSize', () => {
    const queue = makeQueue(1);
    queue.enqueue(makePlayer({ playerId: 'a' }));

    expect(queue.enqueue(makePlayer({ playerId: 'b' }))).toBe(false);
    expect(playerIds(queue)).toEqual(['a']);
  });

  it('rejects enqueueing a player already in the queue', () => {
    const queue = makeQueue(3);
    queue.enqueue(makePlayer({ playerId: 'a' }));

    expect(queue.enqueue(makePlayer({ playerId: 'a', skillRating: 1500 }))).toBe(false);
    expect(queue.size).toBe(1);
  });

  it('dequeues players first-in-first-out', () => {
    const queue = makeQueue(3);
    queue.enqueue(makePlayer({ playerId: 'a' }));
    queue.enqueue(makePlayer({ playerId: 'b' }));

    expect(queue.dequeue()?.playerId).toBe('a');
    expect(playerIds(queue)).toEqual(['b']);
  });

  it('returns undefined when dequeuing an empty queue', () => {
    const queue = makeQueue(3);
    expect(queue.dequeue()).toBeUndefined();
  });
});

describe('boostToFront', () => {
  it('moves a new VIP player straight to the front of the line', () => {
    const queue = makeQueue(3);
    queue.enqueue(makePlayer({ playerId: 'a' }));
    queue.enqueue(makePlayer({ playerId: 'b' }));

    boostToFront(queue, makePlayer({ playerId: 'vip' }));

    expect(playerIds(queue)).toEqual(['vip', 'a', 'b']);
  });

  it('lets a boosted player go out on the very next dequeue', () => {
    const queue = makeQueue(3);
    queue.enqueue(makePlayer({ playerId: 'a' }));

    boostToFront(queue, makePlayer({ playerId: 'vip' }));

    expect(queue.dequeue()?.playerId).toBe('vip');
  });
});
