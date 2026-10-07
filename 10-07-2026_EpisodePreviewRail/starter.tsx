// StreamNest show page - the episode rail viewers use to preview an
// episode's synopsis before committing to play it. Keyboard support (arrow
// keys to move along the rail) got added after an accessibility review
// flagged that mouse-only browsing locked out remote/keyboard users.

import { useState, type KeyboardEvent } from 'react';

export interface Episode {
  id: string;
  title: string;
  episodeNumber: number;
}

export interface EpisodePreview {
  episodeId: string;
  synopsis: string;
  runtimeMin: number;
}

export type FetchEpisodePreview = (episodeId: string) => Promise<EpisodePreview>;

export type PreviewStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface EpisodePreviewRailProps {
  episodes: Episode[];
  fetchEpisodePreview: FetchEpisodePreview;
}

export function EpisodePreviewRail({ episodes, fetchEpisodePreview }: EpisodePreviewRailProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [preview, setPreview] = useState<EpisodePreview | null>(null);
  const [status, setStatus] = useState<PreviewStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function loadPreview(episodeId: string) {
    setStatus('loading');
    setErrorMessage(null);

    fetchEpisodePreview(episodeId)
      .then((result) => {
        setPreview(result);
        setStatus('loaded');
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setStatus('error');
        setErrorMessage(message);
      });
  }

  function focusEpisode(index: number) {
    setFocusedIndex(index);
    loadPreview(episodes[index].id);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusEpisode(Math.min(focusedIndex + 1, episodes.length - 1));
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusEpisode(Math.max(focusedIndex - 1, 0));
    }
  }

  const focusedEpisode = episodes[focusedIndex] ?? null;

  return (
    <div data-testid="episode-rail" tabIndex={0} onKeyDown={handleKeyDown}>
      <ul data-testid="episode-list">
        {episodes.map((episode, index) => (
          <li key={episode.id}>
            <button
              type="button"
              data-testid={`episode-button-${episode.id}`}
              onClick={() => focusEpisode(index)}
              aria-current={focusedIndex === index}
            >
              {episode.episodeNumber}. {episode.title}
            </button>
          </li>
        ))}
      </ul>

      <div data-testid="preview-body">
        {status === 'idle' && (
          <p data-testid="status-message">Pick an episode to preview it.</p>
        )}

        {status === 'loading' && (
          <p data-testid="status-message" role="status">
            Loading preview…
          </p>
        )}

        {status === 'error' && (
          <p data-testid="status-message" role="alert">
            Couldn't load preview: {errorMessage}
          </p>
        )}

        {status === 'loaded' && preview && focusedEpisode && (
          <div data-testid="preview-result">
            <p data-testid="preview-title">{focusedEpisode.title}</p>
            <p data-testid="preview-synopsis">{preview.synopsis}</p>
            <p data-testid="preview-runtime">{preview.runtimeMin} min</p>
          </div>
        )}
      </div>
    </div>
  );
}
