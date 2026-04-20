'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) { setError('Please enter both email and password.'); return; }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) {
        setError(authError.message.toLowerCase().includes('invalid') ? 'Incorrect email or password.' : authError.message);
        setLoading(false); return;
      }
      router.push('/dashboard');
    } catch { setError('An unexpected error occurred.'); setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } });
      if (authError) setError('Failed to initiate Google sign-in.');
    } catch { setError('Google sign-in failed.'); }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setLoading(true);
    try {
      // Pass the next parameter so that the callback redirects the user to the settings page where they can enter their new password
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/settings` });
      if (resetError) { setError(resetError.message); setLoading(false); return; }
      setResetSent(true);
    } catch { setError('Failed to send reset email.'); } finally { setLoading(false); }
  };

  return (
    <div className="auth-root">
      {/* Background */}
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      {/* Back home */}
      <Link href="/" className="auth-back">
        ← FocusRooms
      </Link>

      <div className="auth-wrap">
        {/* Left panel — decorative */}
        <aside className="auth-aside">
          <div className="aside-content">
            <p className="aside-quote">
              "focus is rare & disappears the second you notice it."
            </p>
            <span className="aside-leaf">🌿</span>
          </div>
        </aside>

        {/* Right panel — form */}
        <section className="auth-panel">
          <div className="auth-header">
            {resetMode ? (
              <>
                <h1>forgot?</h1>
                <p>we'll send a link to your inbox.</p>
              </>
            ) : (
              <>
                <h1>welcome back.</h1>
                <p>the canvas has been waiting.</p>
              </>
            )}
          </div>

          {resetMode ? (
            resetSent ? (
              <div className="auth-success">
                ✉️ &nbsp; Check your inbox for a reset link.
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="auth-form">
                {error && <div className="auth-error">{error}</div>}
                <div className="field-group">
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="auth-input" placeholder="your@email.com"
                    autoFocus
                  />
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? <Loader2 size={18} className="spin" /> : 'send reset link'}
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleLogin} className="auth-form">
              {error && <div className="auth-error">{error}</div>}
              <div className="field-group">
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="auth-input" placeholder="your@email.com"
                />
                <input
                  type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="auth-input" placeholder="password"
                />
              </div>

              <button
                type="button"
                onClick={() => setResetMode(true)}
                className="auth-link-btn forgot-link"
              >
                forgot password?
              </button>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : 'sign in'}
              </button>

              <div className="auth-divider"><span>or</span></div>

              <button type="button" onClick={handleGoogleLogin} className="auth-google">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                continue with Google
              </button>
            </form>
          )}

          <div className="auth-footer">
            {resetMode ? (
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => { setResetMode(false); setResetSent(false); setError(''); }}
              >
                ← back to sign in
              </button>
            ) : (
              <p>
                new here?{' '}
                <Link href="/auth/signup" className="auth-link">
                  create an account
                </Link>
              </p>
            )}
          </div>
        </section>
      </div>

      <style>{`
        .auth-root {
          min-height: 100vh;
          display: flex;
          align-items: stretch;
          position: relative;
          overflow: hidden;
          background: var(--color-background);
        }
        .auth-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }
        .auth-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
        }
        .auth-orb-1 {
          width: 60vw; height: 60vw;
          top: -20%; left: -15%;
          background: var(--color-secondary);
          opacity: 0.5;
        }
        .auth-orb-2 {
          width: 40vw; height: 40vw;
          bottom: -10%; right: -8%;
          background: var(--color-primary);
          opacity: 0.1;
        }

        .auth-back {
          position: fixed;
          top: 2rem;
          left: 2.5rem;
          z-index: 100;
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.9rem;
          color: var(--color-text-muted);
          text-decoration: none;
          transition: color 0.3s;
        }
        .auth-back:hover { color: var(--color-text); }

        .auth-wrap {
          position: relative;
          z-index: 1;
          display: flex;
          width: 100%;
          min-height: 100vh;
        }

        /* ── ASIDE ── */
        .auth-aside {
          display: none;
          flex: 0 0 42%;
          background: var(--color-text);
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 860px) {
          .auth-aside { display: flex; align-items: center; justify-content: center; }
        }
        .aside-content {
          padding: 4rem;
          display: flex;
          flex-direction: column;
          gap: 3rem;
          position: relative;
          z-index: 1;
        }
        .aside-quote {
          font-family: var(--font-heading);
          font-style: italic;
          font-size: clamp(2rem, 3vw, 3rem);
          color: var(--color-background);
          line-height: 1.25;
          opacity: 0.9;
        }
        .aside-leaf {
          font-size: 3rem;
          filter: saturate(0.7);
        }

        /* ── PANEL ── */
        .auth-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 5rem 2rem;
          max-width: 480px;
          margin: 0 auto;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 3rem;
          width: 100%;
        }
        .auth-header h1 {
          font-family: var(--font-heading);
          font-style: italic;
          font-size: clamp(2.2rem, 5vw, 3.2rem);
          font-weight: 400;
          color: var(--color-text);
          margin-bottom: 0.5rem;
        }
        .auth-header p {
          font-family: var(--font-body);
          color: var(--color-text-muted);
          font-size: 1rem;
        }

        .auth-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1.5rem;
          padding: 0.4rem;
          box-shadow: 0 4px 20px -8px var(--color-shadow);
        }
        .auth-input {
          width: 100%;
          padding: 0.9rem 1.2rem;
          background: transparent;
          border: none;
          outline: none;
          font-family: var(--font-body);
          font-size: 0.95rem;
          color: var(--color-text);
          text-align: center;
          border-radius: 1.2rem;
          transition: background 0.2s;
        }
        .auth-input::placeholder { color: var(--color-text-muted); font-style: italic; }
        .auth-input:focus { background: var(--color-background); }
        .field-group .auth-input:not(:last-child) {
          border-bottom: 1px solid var(--color-border);
          border-radius: 1.2rem 1.2rem 0 0;
        }
        .field-group .auth-input:last-child {
          border-radius: 0 0 1.2rem 1.2rem;
        }

        .forgot-link {
          text-align: right;
          margin-top: -0.3rem;
        }

        .auth-btn {
          width: 100%;
          padding: 1rem;
          background: var(--color-text);
          color: var(--color-background);
          border: none;
          border-radius: 100px;
          font-family: var(--font-body);
          font-style: italic;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .auth-btn:hover:not(:disabled) {
          background: var(--color-primary);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px -8px rgba(148,168,154,0.4);
        }
        .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          opacity: 0.5;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--color-border);
        }
        .auth-divider span {
          font-family: var(--font-sans);
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .auth-google {
          width: 100%;
          padding: 0.85rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 100px;
          font-family: var(--font-sans);
          font-size: 0.9rem;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }
        .auth-google:hover {
          background: var(--color-background);
          color: var(--color-text);
          box-shadow: 0 4px 15px -5px var(--color-shadow);
        }

        .auth-error {
          background: var(--color-danger-bg);
          border: 1px solid var(--color-danger-border);
          color: var(--color-danger);
          border-radius: 1rem;
          padding: 0.85rem 1.2rem;
          font-family: var(--font-sans);
          font-size: 0.85rem;
          text-align: center;
        }
        .auth-success {
          background: rgba(148,168,154,0.1);
          border: 1px solid var(--color-primary);
          color: var(--color-primary);
          border-radius: 1rem;
          padding: 1.2rem;
          font-family: var(--font-body);
          font-size: 0.95rem;
          text-align: center;
          width: 100%;
        }

        .auth-footer {
          margin-top: 2.5rem;
          text-align: center;
          font-family: var(--font-body);
          font-size: 0.9rem;
          color: var(--color-text-muted);
        }
        .auth-link {
          color: var(--color-text);
          text-decoration: none;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 1px;
          transition: border-color 0.2s;
        }
        .auth-link:hover { border-color: var(--color-text); }

        .auth-link-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 0.85rem;
          color: var(--color-text-muted);
          transition: color 0.2s;
          font-style: italic;
        }
        .auth-link-btn:hover { color: var(--color-text); }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}