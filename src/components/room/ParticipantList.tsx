'use client';

import { PresenceState } from '@/types';
import { Mic, MicOff, MonitorUp } from 'lucide-react';

interface ParticipantListProps {
  readonly participants: readonly PresenceState[];
  readonly currentUserId: string;
  readonly hostId: string;
}

export function ParticipantList({ participants, currentUserId, hostId }: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <div className="pl-empty">
        <span className="pl-empty-icon">🪴</span>
        <p>just you for now.</p>
        <span>share the room code to invite someone.</span>

        <style>{`
          .pl-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2.5rem 1rem;
            gap: 0.5rem;
            text-align: center;
          }
          .pl-empty-icon { font-size: 2rem; margin-bottom: 0.25rem; }
          .pl-empty p {
            font-family: var(--font-heading);
            font-style: italic;
            font-size: 1rem;
            color: var(--color-text);
          }
          .pl-empty span {
            font-family: var(--font-body);
            font-size: 0.78rem;
            color: var(--color-text-muted);
            font-style: italic;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div className="pl-list">
        {participants.map((p, i) => {
          const isYou = p.user_id === currentUserId;
          const isHost = p.user_id === hostId;
          const initial = p.display_name?.charAt(0)?.toUpperCase() || '?';

          return (
            <div
              key={p.user_id}
              className="pl-item"
              id={`participant-${p.user_id}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {/* Avatar */}
              <div className="pl-avatar">
                <span className="pl-avatar-initial">{initial}</span>
                {p.is_mic_on && <span className="pl-mic-ring" />}
              </div>

              {/* Name */}
              <div className="pl-info">
                <span className="pl-name">
                  {p.display_name || 'Anonymous'}
                </span>
                {isHost && <span className="pl-host-badge">Host</span>}
                {isYou && <span className="pl-you-badge">you</span>}
              </div>

              {/* Status */}
              <div className="pl-status">
                {p.is_screen_sharing && (
                  <span className="pl-status-chip pl-status-chip--active" title="Sharing screen">
                    <MonitorUp size={11} />
                  </span>
                )}
                <span
                  className={`pl-status-chip ${p.is_mic_on ? 'pl-status-chip--active' : 'pl-status-chip--muted'}`}
                  title={p.is_mic_on ? 'Mic on' : 'Mic off'}
                >
                  {p.is_mic_on ? <Mic size={11} /> : <MicOff size={11} />}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .pl-list {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .pl-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0.75rem;
          border-radius: 1rem;
          transition: background 0.25s ease;
          animation: plFadeIn 0.4s ease both;
        }
        .pl-item:hover { background: var(--color-background); }

        @keyframes plFadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* ── AVATAR ── */
        .pl-avatar {
          position: relative;
          width: 2.1rem;
          height: 2.1rem;
          flex-shrink: 0;
        }
        .pl-avatar-initial {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-secondary);
          border: 1px solid var(--color-border);
          border-radius: 50%;
          font-family: var(--font-heading);
          font-style: italic;
          font-size: 0.85rem;
          color: var(--color-primary);
        }
        .pl-mic-ring {
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 1.5px solid var(--color-primary);
          animation: micPulse 2.5s ease-in-out infinite;
        }
        @keyframes micPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.9; transform: scale(1.06); }
        }

        /* ── INFO ── */
        .pl-info {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .pl-name {
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.88rem;
          color: var(--color-text);
          truncate: true;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pl-host-badge {
          font-family: var(--font-sans);
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-primary);
          background: rgba(148, 168, 154, 0.1); /* sage background */
          border: 1px solid var(--color-primary);
          padding: 0.15rem 0.45rem;
          border-radius: 100px;
          flex-shrink: 0;
          font-weight: 600;
        }
        .pl-you-badge {
          font-family: var(--font-sans);
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          background: var(--color-background);
          border: 1px solid var(--color-border);
          padding: 0.15rem 0.45rem;
          border-radius: 100px;
          flex-shrink: 0;
        }

        /* ── STATUS ── */
        .pl-status {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          flex-shrink: 0;
        }
        .pl-status-chip {
          width: 1.5rem;
          height: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid var(--color-border);
          transition: all 0.25s ease;
        }
        .pl-status-chip--active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: var(--color-text-on-primary);
        }
        .pl-status-chip--muted {
          background: var(--color-background);
          color: var(--color-text-muted);
          opacity: 0.5;
        }
      `}</style>
    </>
  );
}