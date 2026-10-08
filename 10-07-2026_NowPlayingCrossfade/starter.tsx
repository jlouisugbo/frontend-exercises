// Now-playing bar for Wavelength's web player. Crossfade between tracks
// shipped last sprint so skips don't feel like someone yanked a plug -
// built it fast against the demo playlist, which nobody ever skipped
// through quickly.

import { useEffect, useRef, useState } from 'react';

export interface AudioPlayer {
  setVolume: (level: number) => void;
}

export interface Track {
  id: string;
  title: string;
  player: AudioPlayer;
}

const FADE_STEPS = 5;
const FADE_INTERVAL_MS = 100;

// Ramps `toTrack` up from 0 and `fromTrack` (if any) down to 0 over
// FADE_STEPS ticks. Returns a cleanup function that cancels the fade.
export function crossfade(fromTrack: Track | null, toTrack: Track): () => void {
  let step = 0;

  const intervalId = setInterval(() => {
    step += 1;
    const toLevel = Math.min(1, step / FADE_STEPS);
    const fromLevel = Math.max(0, 1 - step / FADE_STEPS);

    toTrack.player.setVolume(toLevel);
    fromTrack?.player.setVolume(fromLevel);

    if (step >= FADE_STEPS) {
      clearInterval(intervalId);
    }

  }, FADE_INTERVAL_MS);

  return () => clearInterval(intervalId);
}

export interface NowPlayingBarProps {
  queue: Track[];
  initialIndex?: number;
}

export function NowPlayingBar({ queue, initialIndex = 0 }: NowPlayingBarProps) {
  const [index, setIndex] = useState(initialIndex);
  const previousTrackRef = useRef<Track | null>(null);

  useEffect(() => {
    const track = queue[index];
    if (!track) {
      return;
    }

    const cancel = crossfade(previousTrackRef.current, track);
    previousTrackRef.current = track;
    return cancel
  }, [index, queue]);

  function handleSkip() {
    setIndex((current) => Math.min(current + 1, queue.length - 1));
  }

  const current = queue[index];

  return (
    <div data-testid="now-playing-bar">
      <p data-testid="current-track">{current ? current.title : 'Nothing playing'}</p>
      <button data-testid="skip-button" onClick={handleSkip} disabled={index >= queue.length - 1}>
        Skip
      </button>
    </div>
  );
}
