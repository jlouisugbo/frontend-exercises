import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  EpisodePreviewRail,
  type Episode,
  type EpisodePreview,
  type FetchEpisodePreview,
} from './starter';

// --- Seam ---------------------------------------------------------------
// The only place that knows how EpisodePreviewRail is constructed, how an
// episode gets focused (by click or by arrow key), and how
// fetchEpisodePreview results get back into it. If you refactor the
// component's internals (the handler, a ref, a request id, whatever you
// like), update ONLY the helpers in this block - the test cases below
// should keep working unchanged as long as the component's public props
// and rendered output stay the same shape.

const EPISODES: Episode[] = [
  { id: 'ep-1', title: 'Pilot', episodeNumber: 1 },
  { id: 'ep-2', title: 'The Long Game', episodeNumber: 2 },
  { id: 'ep-3', title: 'Reckoning', episodeNumber: 3 },
];

function renderRail(fetchEpisodePreview: FetchEpisodePreview, episodes: Episode[] = EPISODES) {
  return render(
    <EpisodePreviewRail episodes={episodes} fetchEpisodePreview={fetchEpisodePreview} />
  );
}

function fetchPreviewResolvingWith(preview: EpisodePreview): FetchEpisodePreview {
  return () => Promise.resolve(preview);
}

function fetchPreviewRejectingWith(message: string): FetchEpisodePreview {
  return () => Promise.reject(new Error(message));
}

function clickEpisode(episodeId: string) {
  fireEvent.click(screen.getByTestId(`episode-button-${episodeId}`));
}

function pressArrowRight() {
  fireEvent.keyDown(screen.getByTestId('episode-rail'), { key: 'ArrowRight' });
}

function pressArrowLeft() {
  fireEvent.keyDown(screen.getByTestId('episode-rail'), { key: 'ArrowLeft' });
}

function pressUnhandledKey() {
  fireEvent.keyDown(screen.getByTestId('episode-rail'), { key: 'Enter' });
}
// -------------------------------------------------------------------------

describe('EpisodePreviewRail', () => {
  it('shows an idle prompt and calls no fetch before any episode is chosen', () => {
    const fetchEpisodePreview = vi.fn();
    renderRail(fetchEpisodePreview);

    expect(screen.getByTestId('status-message')).toHaveTextContent('Pick an episode');
    expect(screen.queryByTestId('preview-result')).not.toBeInTheDocument();
    expect(fetchEpisodePreview).not.toHaveBeenCalled();
  });

  it('shows a loading indicator immediately after an episode button is clicked', async () => {
    const fetchEpisodePreview: FetchEpisodePreview = () => new Promise(() => {}); // never resolves
    renderRail(fetchEpisodePreview);

    clickEpisode('ep-2');

    expect(await screen.findByTestId('status-message')).toHaveTextContent('Loading preview');
  });

  it('renders the preview once the fetch resolves', async () => {
    const fetchEpisodePreview = fetchPreviewResolvingWith({
      episodeId: 'ep-2',
      synopsis: 'A quiet negotiation turns into something else entirely.',
      runtimeMin: 42,
    });
    renderRail(fetchEpisodePreview);

    clickEpisode('ep-2');

    expect(await screen.findByTestId('preview-title')).toHaveTextContent('The Long Game');
    expect(screen.getByTestId('preview-synopsis')).toHaveTextContent('negotiation');
    expect(screen.getByTestId('preview-runtime')).toHaveTextContent('42 min');
  });

  it('marks the clicked episode as current and leaves the others not current', async () => {
    const fetchEpisodePreview = fetchPreviewResolvingWith({
      episodeId: 'ep-2',
      synopsis: 'A quiet negotiation turns into something else entirely.',
      runtimeMin: 42,
    });
    renderRail(fetchEpisodePreview);

    clickEpisode('ep-2');
    await screen.findByTestId('preview-result');

    expect(screen.getByTestId('episode-button-ep-2')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByTestId('episode-button-ep-1')).toHaveAttribute('aria-current', 'false');
    expect(screen.getByTestId('episode-button-ep-3')).toHaveAttribute('aria-current', 'false');
  });

  it('shows an error message and no preview result when the fetch rejects', async () => {
    const fetchEpisodePreview = fetchPreviewRejectingWith('cdn timeout');
    renderRail(fetchEpisodePreview);

    clickEpisode('ep-1');

    expect(await screen.findByRole('alert')).toHaveTextContent('cdn timeout');
    expect(screen.queryByTestId('preview-result')).not.toBeInTheDocument();
  });

  it('shows a generic error message when the fetch rejects with something other than an Error', async () => {
    const fetchEpisodePreview: FetchEpisodePreview = () => Promise.reject<EpisodePreview>('boom');
    renderRail(fetchEpisodePreview);

    clickEpisode('ep-1');

    expect(await screen.findByRole('alert')).toHaveTextContent('Unknown error');
  });

  it('loads the newly clicked episode when a different one is clicked after one is already loaded', async () => {
    const fetchEpisodePreview = vi.fn((episodeId: string) =>
      Promise.resolve(
        episodeId === 'ep-1'
          ? { episodeId, synopsis: 'A detective takes a case nobody else wants.', runtimeMin: 38 }
          : { episodeId, synopsis: 'The crew finally gets a lead worth following.', runtimeMin: 45 }
      )
    );
    renderRail(fetchEpisodePreview);

    clickEpisode('ep-1');
    expect(await screen.findByTestId('preview-title')).toHaveTextContent('Pilot');

    clickEpisode('ep-3');
    expect(await screen.findByTestId('preview-title')).toHaveTextContent('Reckoning');

    expect(fetchEpisodePreview).toHaveBeenCalledTimes(2);
  });

  it('moves focus to the next episode on ArrowRight and loads its preview', async () => {
    const fetchEpisodePreview = vi.fn((episodeId: string) =>
      Promise.resolve({ episodeId, synopsis: 'Preview text.', runtimeMin: 40 })
    );
    renderRail(fetchEpisodePreview);

    pressArrowRight();

    expect(await screen.findByTestId('preview-title')).toHaveTextContent('The Long Game');
    expect(screen.getByTestId('episode-button-ep-2')).toHaveAttribute('aria-current', 'true');
    expect(fetchEpisodePreview).toHaveBeenCalledWith('ep-2');
  });

  it('moves focus to the previous episode on ArrowLeft', async () => {
    const fetchEpisodePreview = vi.fn((episodeId: string) =>
      Promise.resolve({ episodeId, synopsis: 'Preview text.', runtimeMin: 40 })
    );
    renderRail(fetchEpisodePreview);

    clickEpisode('ep-3');
    await screen.findByTestId('preview-result');

    pressArrowLeft();

    expect(await screen.findByTestId('preview-title')).toHaveTextContent('The Long Game');
    expect(screen.getByTestId('episode-button-ep-2')).toHaveAttribute('aria-current', 'true');
  });

  it('does not move past the last episode when ArrowRight is pressed again at the end', async () => {
    const fetchEpisodePreview = vi.fn((episodeId: string) =>
      Promise.resolve({ episodeId, synopsis: 'Preview text.', runtimeMin: 40 })
    );
    renderRail(fetchEpisodePreview);

    clickEpisode('ep-3');
    await screen.findByTestId('preview-result');

    pressArrowRight();

    expect(await screen.findByTestId('preview-title')).toHaveTextContent('Reckoning');
    expect(screen.getByTestId('episode-button-ep-3')).toHaveAttribute('aria-current', 'true');
  });

  it('does not move before the first episode when ArrowLeft is pressed at the start', () => {
    const fetchEpisodePreview = vi.fn(() => new Promise<EpisodePreview>(() => {}));
    renderRail(fetchEpisodePreview);

    pressArrowLeft();

    expect(fetchEpisodePreview).toHaveBeenCalledWith('ep-1');
    expect(screen.getByTestId('episode-button-ep-1')).toHaveAttribute('aria-current', 'true');
  });

  it('does nothing when an unrelated key is pressed', () => {
    const fetchEpisodePreview = vi.fn();
    renderRail(fetchEpisodePreview);

    pressUnhandledKey();

    expect(fetchEpisodePreview).not.toHaveBeenCalled();
    expect(screen.getByTestId('status-message')).toHaveTextContent('Pick an episode');
  });
});
