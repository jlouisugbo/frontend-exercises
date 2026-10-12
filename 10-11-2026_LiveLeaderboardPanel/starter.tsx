// Live leaderboard panel for FitPulse's step-count challenge screen.
// Friends' scores come in as a prop from the challenge screen, which owns
// the sync logic - this panel just has to say who's leading right now.

import { useEffect, useState } from 'react';

export interface FriendScore {
  friendId: string;
  name: string;
  steps: number;
}

export interface LeaderboardPanelProps {
  scores: FriendScore[];
}

export function LeaderboardPanel({ scores }: LeaderboardPanelProps) {
  const [leader, setLeader] = useState<FriendScore | null>(null);

  useEffect(() => {
    if (scores.length === 0) {
      setLeader(null);
      return;
    }

    const top = scores.reduce((best, current) => (current.steps > best.steps ? current : best));
    setLeader(top);
  }, [scores]);

  if (scores.length === 0) {
    return <p data-testid="empty-state">No step data yet today.</p>;
  }

  return (
    <div data-testid="leaderboard-panel">
      <p data-testid="leader-name">{leader?.name ?? '--'}</p>
      <p data-testid="leader-steps">{leader?.steps ?? 0}</p>
    </div>
  );
}
