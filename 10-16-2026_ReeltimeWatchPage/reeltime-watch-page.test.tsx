import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { WatchPage, type VideoMeta, type RelatedVideo } from './starter';

// --- Seam ---------------------------------------------------------------
// This is the only place that knows how WatchPage gets built and how its
// playback clock is advanced. If you refactor the internals (split the
// context, add memoization, whatever), update ONLY the helpers in this
// block - the test cases below should keep working unchanged as long as
// WatchPage's public props and rendered output stay the same shape.

function makeVideo(overrides: Partial<VideoMeta> = {}): VideoMeta {
  return {
    id: 'v1',
    title: 'Restoring a 1972 Camper Van',
    channelName: 'Weekend Builds',
    description: 'A full walkthrough of a budget camper van restoration.',
    durationSec: 125,
    ...overrides,
  };
}

function makeRelated(): RelatedVideo[] {
  return [
    { id: 'v2', title: 'Choosing a Roof Vent' },
    { id: 'v3', title: 'Insulating a Van on a Budget' },
  ];
}

function renderWatchPage(
  overrides: { video?: VideoMeta; related?: RelatedVideo[]; tickMs?: number } = {}
) {
  return render(
    <WatchPage
      video={overrides.video ?? makeVideo()}
      related={overrides.related ?? makeRelated()}
      tickMs={overrides.tickMs ?? 1000}
    />
  );
}

async function advanceTicks(count: number, tickMs = 1000) {
  await act(async () => {
    vi.advanceTimersByTime(count * tickMs);
  });
}

function clickDecrease(times = 1) {
  for (let i = 0; i < times; i++) {
    fireEvent.click(screen.getByRole('button', { name: 'decrease volume' }));
  }
}

function clickIncrease(times = 1) {
  for (let i = 0; i < times; i++) {
    fireEvent.click(screen.getByRole('button', { name: 'increase volume' }));
  }
}
// -------------------------------------------------------------------------

describe('WatchPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the video title, channel, and description on first render', () => {
    renderWatchPage();

    expect(screen.getByTestId('video-title')).toHaveTextContent('Restoring a 1972 Camper Van');
    expect(screen.getByTestId('video-channel')).toHaveTextContent('Weekend Builds');
    expect(screen.getByTestId('video-description')).toHaveTextContent(
      'A full walkthrough of a budget camper van restoration.'
    );
  });

  it('shows related videos when there are some', () => {
    renderWatchPage();

    expect(screen.getByTestId('related-v2')).toHaveTextContent('Choosing a Roof Vent');
    expect(screen.getByTestId('related-v3')).toHaveTextContent('Insulating a Van on a Budget');
    expect(screen.queryByTestId('related-empty')).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no related videos', () => {
    renderWatchPage({ related: [] });

    expect(screen.getByTestId('related-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('related-list')).not.toBeInTheDocument();
  });

  it('starts the scrub bar at 0:00 against the video duration', () => {
    renderWatchPage();

    expect(screen.getByTestId('scrub-bar')).toHaveTextContent('0:00 / 2:05');
  });

  it('pads single-digit seconds with a leading zero as the clock ticks', async () => {
    renderWatchPage({ video: makeVideo({ durationSec: 600 }) });

    await advanceTicks(5);

    expect(screen.getByTestId('scrub-bar')).toHaveTextContent('0:05 / 10:00');
  });

  it('stops padding seconds once they reach double digits', async () => {
    renderWatchPage({ video: makeVideo({ durationSec: 600 }) });

    await advanceTicks(70);

    expect(screen.getByTestId('scrub-bar')).toHaveTextContent('1:10 / 10:00');
  });

  it('decreases volume in 10% steps', () => {
    renderWatchPage();

    clickDecrease(1);

    expect(screen.getByTestId('volume-value')).toHaveTextContent('90%');
  });

  it('clamps volume at 0% instead of going negative', () => {
    renderWatchPage();

    clickDecrease(10);

    expect(screen.getByTestId('volume-value')).toHaveTextContent('0%');
  });

  it('increases volume in 10% steps', () => {
    renderWatchPage();

    clickDecrease(10);
    clickIncrease(1);

    expect(screen.getByTestId('volume-value')).toHaveTextContent('10%');
  });

  it('clamps volume at 100% instead of exceeding it', () => {
    renderWatchPage();

    clickDecrease(10);
    clickIncrease(10);

    expect(screen.getByTestId('volume-value')).toHaveTextContent('100%');
  });

  it('keeps showing the same video info and related videos as the clock ticks', async () => {
    renderWatchPage();

    await advanceTicks(5);

    expect(screen.getByTestId('video-title')).toHaveTextContent('Restoring a 1972 Camper Van');
    expect(screen.getByTestId('related-v2')).toHaveTextContent('Choosing a Roof Vent');
  });
});
