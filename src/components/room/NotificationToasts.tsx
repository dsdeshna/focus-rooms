'use client';

import { useEffect, useState } from 'react';
import { Notification } from '@/types';
import { X } from 'lucide-react';

interface NotificationToastsProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const TYPE_CONFIG = {
  info:    { emoji: '✦', accent: 'var(--color-primary)',  bg: 'rgba(148,168,154,0.08)',  border: 'rgba(148,168,154,0.25)' },
  warning: { emoji: '◈', accent: '#C9A84C',               bg: 'rgba(201,168,76,0.08)',   border: 'rgba(201,168,76,0.25)'  },
  success: { emoji: '✿', accent: '#8EC4A1',               bg: 'rgba(142,196,161,0.08)',  border: 'rgba(142,196,161,0.25)' },
};

function Toast({ notif, onDismiss }: { notif: Notification; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.info;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(() => onDismiss(notif.id), 350);
  };

  return (
    <div
      className="toast-item"
      style={{
        opacity: visible && !leaving ? 1 : 0,
        transform: visible && !leaving ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.95)',
        borderColor: config.border,
        background: `${config.bg}`,
      }}
      aria-live="polite"
    >
      <span className="toast-emoji" style={{ color: config.accent }}>
        {config.emoji}
      </span>
      <p className="toast-message">{notif.message}</p>
      <button className="toast-close" onClick={handleDismiss} aria-label="Dismiss">
        <X size={12} />
      </button>

      <style>{`
        .toast-item {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.5rem 0.8rem 0.5rem 1rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 2rem;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 10px 25px -10px var(--color-shadow-lg);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.15);
          max-width: 450px;
          min-width: 260px;
          pointer-events: auto;
        }
        .toast-emoji {
          font-size: 0.85rem;
          flex-shrink: 0;
          line-height: 1;
        }
        .toast-message {
          flex: 1;
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.82rem;
          color: var(--color-text);
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .toast-close {
          background: var(--color-background);
          border: 1px solid var(--color-border);
          cursor: pointer;
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.4rem;
          height: 1.4rem;
          border-radius: 50%;
          flex-shrink: 0;
          transition: all 0.2s ease;
          opacity: 0.8;
        }
        .toast-close:hover {
          opacity: 1;
          background: var(--color-surface);
          border-color: var(--color-primary);
          color: var(--color-primary);
          transform: rotate(90deg);
        }
      `}</style>
    </div>
  );
}

export function NotificationToasts({ notifications, onDismiss }: NotificationToastsProps) {
  if (notifications.length === 0) return null;

  return (
    <>
      <div className="toasts-container">
        {notifications.map(notif => (
          <Toast key={notif.id} notif={notif} onDismiss={onDismiss} />
        ))}
      </div>

      <style>{`
        .toasts-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
        }
        .toasts-container > * {
          pointer-events: auto;
        }
      `}</style>
    </>
  );
}