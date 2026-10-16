// Reeltime's watch page: one playback context backs the scrub bar, volume
// control, and the video info / related-videos panels below the player.
// Wired up fast for the relaunch - everything the player touches lives in
// one context, so any component under the player can just grab what it
// needs with a single hook.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface VideoMeta {
  id: string;
  title: string;
  channelName: string;
  description: string;
  durationSec: number;
}

export interface RelatedVideo {
  id: string;
  title: string;
}

interface PlaybackContextValue {
  currentTimeSec: number;
  volume: number;
  video: VideoMeta;
  related: RelatedVideo[];
  setVolume: (volume: number) => void;
}

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

function usePlayback(): PlaybackContextValue {
  const ctx = useContext(PlaybackContext);
  if (!ctx) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return ctx;
}

interface PlaybackProviderProps {
  video: VideoMeta;
  related: RelatedVideo[];
  tickMs?: number;
  children: ReactNode;
}

// Drives the player's "clock." In production this ticks every 250ms; tests
// pass a longer tickMs so they can advance it deterministically with fake
// timers instead of waiting on real time.
function PlaybackProvider({ video, related, tickMs = 250, children }: PlaybackProviderProps) {
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentTimeSec((t) => t + 1);
    }, tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  const value: PlaybackContextValue = {
    currentTimeSec,
    volume,
    video,
    related,
    setVolume,
  };

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}

function formatTime(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const secsLabel = secs < 10 ? `0${secs}` : `${secs}`;
  return `${mins}:${secsLabel}`;
}

function ScrubBar() {
  const { currentTimeSec, video } = usePlayback();
  return (
    <div data-testid="scrub-bar">
      {formatTime(currentTimeSec)} / {formatTime(video.durationSec)}
    </div>
  );
}

function decreaseVolume(current: number): number {
  if (current <= 0.1) {
    return 0;
  }
  return Math.round((current - 0.1) * 100) / 100;
}

function increaseVolume(current: number): number {
  if (current >= 0.9) {
    return 1;
  }
  return Math.round((current + 0.1) * 100) / 100;
}

function VolumeControl() {
  const { volume, setVolume } = usePlayback();
  return (
    <div data-testid="volume-control">
      <button aria-label="decrease volume" onClick={() => setVolume(decreaseVolume(volume))}>
        -
      </button>
      <span data-testid="volume-value">{Math.round(volume * 100)}%</span>
      <button aria-label="increase volume" onClick={() => setVolume(increaseVolume(volume))}>
        +
      </button>
    </div>
  );
}

function VideoInfoPanel() {
  const { video } = usePlayback();
  return (
    <div data-testid="video-info">
      <h2 data-testid="video-title">{video.title}</h2>
      <p data-testid="video-channel">{video.channelName}</p>
      <p data-testid="video-description">{video.description}</p>
    </div>
  );
}

function RelatedVideosList() {
  const { related } = usePlayback();

  if (related.length === 0) {
    return <p data-testid="related-empty">No related videos yet.</p>;
  }

  return (
    <ul data-testid="related-list">
      {related.map((r) => (
        <li key={r.id} data-testid={`related-${r.id}`}>
          {r.title}
        </li>
      ))}
    </ul>
  );
}

export interface WatchPageProps {
  video: VideoMeta;
  related: RelatedVideo[];
  tickMs?: number;
}

export function WatchPage({ video, related, tickMs }: WatchPageProps) {
  return (
    <PlaybackProvider video={video} related={related} tickMs={tickMs}>
      <ScrubBar />
      <VolumeControl />
      <VideoInfoPanel />
      <RelatedVideosList />
    </PlaybackProvider>
  );
}
