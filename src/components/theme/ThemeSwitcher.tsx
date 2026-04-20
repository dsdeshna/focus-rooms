'use client';

import { useState, useRef, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { themes, themeKeys } from '@/lib/themes/ThemeStrategy';
import { useTheme } from '@/components/theme/ThemeProvider';

export function ThemeSwitcher() {
  const { currentTheme, isDark, setTheme, toggleDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="ts-root" ref={dropdownRef}>
      <div className="ts-controls">
        {/* Dark mode */}
        <button
          onClick={toggleDark}
          className="ts-icon-btn"
          title={isDark ? 'Light mode' : 'Dark mode'}
          id="dark-mode-toggle"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Theme picker */}
        <button
          onClick={() => setIsOpen(v => !v)}
          className={`ts-palette-btn ${isOpen ? 'ts-palette-btn--open' : ''}`}
          title="Choose colour theme"
          id="theme-switcher-btn"
          aria-label="Open theme picker"
        >
          <span className="ts-current-swatch" style={{ background: themes[currentTheme]?.colors.primary || 'var(--color-primary)' }} />
          <span className="ts-current-name">{themes[currentTheme]?.emoji || '🎨'}</span>
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="ts-dropdown">
          <div className="ts-dropdown-header">
            <span>colour theme</span>
          </div>

          <div className="ts-theme-grid">
            {themeKeys.map(key => {
              const theme = themes[key];
              const isActive = currentTheme === key;
              return (
                <button
                  key={key}
                  onClick={() => { setTheme(key); setIsOpen(false); }}
                  className={`ts-theme-item ${isActive ? 'ts-theme-item--active' : ''}`}
                  id={`theme-${key}`}
                  title={theme.name}
                >
                  <span className="ts-theme-emoji">{theme.emoji}</span>
                  <span className="ts-theme-name">{theme.name}</span>
                  {isActive && <span className="ts-active-dot" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .ts-root {
          position: relative;
          display: inline-flex;
        }

        /* ── CONTROLS ── */
        .ts-controls {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .ts-icon-btn {
          width: 2rem; height: 2rem;
          display: flex; align-items: center; justify-content: center;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 50%;
          cursor: pointer;
          color: var(--color-text-muted);
          transition: all 0.3s ease;
        }
        .ts-icon-btn:hover {
          background: var(--color-primary);
          color: var(--color-text-on-primary);
          border-color: var(--color-primary);
          transform: scale(1.05);
        }

        .ts-palette-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.7rem 0.35rem 0.45rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .ts-palette-btn:hover,
        .ts-palette-btn--open {
          border-color: var(--color-primary);
          background: var(--color-background);
        }
        .ts-current-swatch {
          width: 12px; height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.08);
          flex-shrink: 0;
        }
        .ts-current-name {
          font-size: 0.85rem;
          line-height: 1;
        }

        /* ── DROPDOWN ── */
        .ts-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 0.6rem);
          z-index: 300;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1.5rem;
          box-shadow: 0 16px 40px -8px var(--color-shadow-lg),
                      0 4px 12px -4px var(--color-shadow);
          padding: 0.75rem;
          min-width: 230px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          animation: dropIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .ts-dropdown-header {
          padding: 0.25rem 0.5rem 0.65rem;
          font-family: var(--font-sans);
          font-size: 0.62rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          opacity: 0.7;
          border-bottom: 1px solid var(--color-border);
          margin-bottom: 0.5rem;
        }

        .ts-theme-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.3rem;
        }

        .ts-theme-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.55rem 0.7rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 1rem;
          cursor: pointer;
          text-align: left;
          transition: all 0.25s ease;
        }
        .ts-theme-item:hover {
          background: var(--color-background);
          border-color: var(--color-border);
        }
        .ts-theme-item--active {
          background: var(--color-background);
          border-color: var(--color-primary);
        }

        .ts-theme-emoji { font-size: 1rem; line-height: 1; flex-shrink: 0; }
        .ts-theme-name {
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.78rem;
          color: var(--color-text);
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ts-active-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--color-primary);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}