import { useEffect, useState, memo, type CSSProperties } from "react";

export interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  compatibilityScore: number; // 0-100
  lastActiveAt: number; // epoch ms
}

// Quick render telemetry added last sprint so support could see which cards
// were actually re-rendering when a few users on older phones complained
// the queue felt janky. Not wired up to anything beyond this object yet.
export const cardRenderCounts: Record<string, number> = {};

function presenceLabel(lastActiveAt: number, now: number): string {
  const diffMs = now - lastActiveAt;
  if (diffMs < 60_000) return "Online now";
  if (diffMs < 60 * 60_000) return `Active ${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 24 * 60 * 60_000) return `Active ${Math.floor(diffMs / (60 * 60_000))}h ago`;
  return "Offline";
}

interface ProfileCardProps {
  profile: Profile;
  now: number;
  onLike: (id: string) => void;
  onPass: (id: string) => void;
  cardStyle: CSSProperties;
}

// Each card draws a compatibility ring and truncates the bio to a fixed
// number of lines, which isn't free - that's why this got wrapped in memo
// a while back, on the theory that a card shouldn't have to redo that work
// just because some other part of the screen changed.
const ProfileCard = memo(function ProfileCard({
  profile,
  now,
  onLike,
  onPass,
  cardStyle,
}: ProfileCardProps) {
  cardRenderCounts[profile.id] = (cardRenderCounts[profile.id] ?? 0) + 1;

  return (
    <div className="profile-card" style={cardStyle} data-testid={`card-${profile.id}`}>
      <h3>
        {profile.name}, {profile.age}
      </h3>
      <p>{profile.bio}</p>
      <span data-testid={`presence-${profile.id}`}>
        {presenceLabel(profile.lastActiveAt, now)}
      </span>
      <span data-testid={`score-${profile.id}`}>{profile.compatibilityScore}% match</span>
      <button onClick={() => onLike(profile.id)}>Like</button>
      <button onClick={() => onPass(profile.id)}>Pass</button>
    </div>
  );
});

export interface MatchQueueProps {
  profiles: Profile[];
  onDecision: (id: string, decision: "like" | "pass") => void;
  /** Exposed so tests don't have to wait out a real 5s cadence. */
  presenceTickMs?: number;
}

const DEFAULT_PRESENCE_TICK_MS = 5000;

export function MatchQueue({
  profiles,
  onDecision,
  presenceTickMs = DEFAULT_PRESENCE_TICK_MS,
}: MatchQueueProps) {
  const [queue, setQueue] = useState(profiles);
  const [now, setNow] = useState(() => Date.now());

  // Presence ticks every few seconds so "Active Xm ago" stays roughly fresh
  // without anyone having to refresh the page.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), presenceTickMs);
    return () => clearInterval(interval);
  }, [presenceTickMs]);

  function decide(id: string, decision: "like" | "pass") {
    setQueue((q) => q.filter((p) => p.id !== id));
    onDecision(id, decision);
  }

  if (queue.length === 0) {
    return <div data-testid="empty-queue">No more profiles nearby. Check back later.</div>;
  }

  return (
    <div className="match-queue">
      {queue.map((profile) => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          now={now}
          onLike={(id) => decide(id, "like")}
          onPass={(id) => decide(id, "pass")}
          cardStyle={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}
        />
      ))}
    </div>
  );
}
