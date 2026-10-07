import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { NowPlayingBar, type Track, type AudioPlayer } from './starter';

// --- Seam ---------------------------------------------------------------
// The only place that knows how a queue of tracks (and their fake audio
// players) gets built, and how fades get advanced in a test. If you
// refactor the internals (storing fade cleanup in a ref, a custom hook,
// whatever), update ONLY the helpers in this block - the test cases below
// should keep working unchanged as long as NowPlayingBar's public props
// and rendered output stay the same shape.

function makePlayer(): AudioPlayer & { setVolume: ReturnType<typeof vi.fn> } {
  return { setVolume: vi.fn() };
}

function makeTrack(id: string, title: string): Track & { player: ReturnType<typeof makePlayer> } {
  return { id, title, player: makePlayer() };
}

function renderBar(tracks: Track[]) {
  return render(<NowPlayingBar queue={tracks} />);
}

// Advances every pending timer by `ms`, flushing React state updates that
// result from it.
async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

const FULL_FADE_MS = 600; // comfortably past FADE_STEPS * FADE_INTERVAL_MS
// -------------------------------------------------------------------------

describe('NowPlayingBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the first track and ramps its volume up to full with no previous track to fade out', async () => {
    const trackA = makeTrack('a', 'Morning Light');
    renderBar([trackA]);

    expect(screen.getByTestId('current-track')).toHaveTextContent('Morning Light');

    await advance(FULL_FADE_MS);

    expect(trackA.player.setVolume).toHaveBeenLastCalledWith(1);
  });

  it('fades the previous track out while fading the new one in on skip', async () => {
    const trackA = makeTrack('a', 'Morning Light');
    const trackB = makeTrack('b', 'Open Road');
    renderBar([trackA, trackB]);
    await advance(FULL_FADE_MS);
    trackA.player.setVolume.mockClear();

    fireEvent.click(screen.getByTestId('skip-button'));
    await advance(FULL_FADE_MS);

    expect(screen.getByTestId('current-track')).toHaveTextContent('Open Road');
    expect(trackB.player.setVolume).toHaveBeenLastCalledWith(1);
    expect(trackA.player.setVolume).toHaveBeenLastCalledWith(0);
  });

  it('disables the skip button on the last track in the queue', async () => {
    const trackA = makeTrack('a', 'Morning Light');
    const trackB = makeTrack('b', 'Open Road');
    renderBar([trackA, trackB]);
    await advance(FULL_FADE_MS);

    fireEvent.click(screen.getByTestId('skip-button'));
    await advance(FULL_FADE_MS);

    expect(screen.getByTestId('skip-button')).toBeDisabled();
  });

  it('does nothing when skip is clicked on the last track', async () => {
    const trackA = makeTrack('a', 'Morning Light');
    renderBar([trackA]);
    await advance(FULL_FADE_MS);
    trackA.player.setVolume.mockClear();

    fireEvent.click(screen.getByTestId('skip-button'));
    await advance(FULL_FADE_MS);

    expect(screen.getByTestId('current-track')).toHaveTextContent('Morning Light');
    expect(trackA.player.setVolume).not.toHaveBeenCalled();
  });

  it('shows a placeholder when the queue is empty', () => {
    renderBar([]);

    expect(screen.getByTestId('current-track')).toHaveTextContent('Nothing playing');
    expect(screen.getByTestId('skip-button')).toBeDisabled();
  });
});
