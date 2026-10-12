import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeaderboardPanel, type FriendScore } from './starter';

// --- Seam ---------------------------------------------------------------
// This is the only place that knows how LeaderboardPanel gets rendered and
// re-rendered. If you refactor the internals (drop the effect, add
// useMemo, whatever), update ONLY the helpers below - the test cases
// underneath should keep working unchanged as long as the component's
// public props and rendered output stay the same shape.

function renderPanel(scores: FriendScore[]) {
  return render(<LeaderboardPanel scores={scores} />);
}
// -------------------------------------------------------------------------

describe('LeaderboardPanel', () => {
  it('shows the no-data state when there are no scores yet', () => {
    renderPanel([]);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('leaderboard-panel')).not.toBeInTheDocument();
  });

  it('shows the friend with the most steps as the leader', () => {
    renderPanel([
      { friendId: 'f1', name: 'Amara', steps: 4200 },
      { friendId: 'f2', name: 'Beto', steps: 9100 },
      { friendId: 'f3', name: 'Cass', steps: 6800 },
    ]);

    expect(screen.getByTestId('leader-name')).toHaveTextContent('Beto');
    expect(screen.getByTestId('leader-steps')).toHaveTextContent('9100');
  });

  it('updates the leader when scores changes to a new array with a new leader', () => {
    const { rerender } = renderPanel([
      { friendId: 'f1', name: 'Amara', steps: 4200 },
      { friendId: 'f2', name: 'Beto', steps: 9100 },
    ]);

    expect(screen.getByTestId('leader-name')).toHaveTextContent('Beto');

    rerender(
      <LeaderboardPanel
        scores={[
          { friendId: 'f1', name: 'Amara', steps: 15000 },
          { friendId: 'f2', name: 'Beto', steps: 9100 },
        ]}
      />
    );

    expect(screen.getByTestId('leader-name')).toHaveTextContent('Amara');
    expect(screen.getByTestId('leader-steps')).toHaveTextContent('15000');
  });

  it('goes back to the empty state if scores becomes empty again', () => {
    const { rerender } = renderPanel([{ friendId: 'f1', name: 'Amara', steps: 4200 }]);

    expect(screen.getByTestId('leaderboard-panel')).toBeInTheDocument();

    rerender(<LeaderboardPanel scores={[]} />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('leaderboard-panel')).not.toBeInTheDocument();
  });
});
