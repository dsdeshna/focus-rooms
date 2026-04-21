'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!displayName.trim() || !email.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { display_name: displayName.trim() }, emailRedirectTo: `${globalThis.location.origin}/auth/callback` },
      });
      if (authError) {
        if (authError.message.toLowerCase().includes('already registered')) setError('This email is already registered.');
        else if (authError.message.toLowerCase().includes('password')) setError('Password is too weak.');
        else setError(authError.message);
        setLoading(false); return;
      }
      router.push('/dashboard');
    } catch { setError('An unexpected error occurred.'); setLoading(false); }
  };

  const handleGoogleSignup = async () => {
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${globalThis.location.origin}/auth/callback` } });
      if (authError) setError('Failed to initiate Google sign-up.');
    } catch { setError('Google sign-up failed.'); }
  };

  return (
    <div className="auth-root">
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <Link href="/" className="auth-back">← FocusRooms</Link>

      <div className="auth-wrap">
        {/* Right aside (reversed layout from login) */}
        <section className="auth-panel">
          <div className="auth-header">
            <h1>join us.</h1>
            <p>cultivate your creative space.</p>
          </div>

          <form onSubmit={handleSignup} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div className="field-group">
              <input
                type="text" value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="auth-input" placeholder="your name"
                autoFocus
              />
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                className="auth-input" placeholder="your@email.com"
              />
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                className="auth-input" placeholder="choose a password"
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : 'create account'}
            </button>

            <div className="auth-divider"><span>or</span></div>

            <button type="button" onClick={handleGoogleSignup} className="auth-google">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              continue with Google
            </button>
          </form>

          <div className="auth-footer">
            <p>
              already a member?{' '}
              <Link href="/auth/login" className="auth-link">sign in</Link>
            </p>
          </div>
        </section>

        <aside className="auth-aside">
          <div className="aside-content">
            <p className="aside-quote">
              focus is rare,<br></br> so we made< br></br> a place for it
            </p>
            <div className="aside-petals">
              <span>˚⋆𐙚｡⋆𖦹.✧˚</span>
            </div>
          </div>
        </aside>
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
          width: 50vw; height: 50vw;
          top: -10%; right: -10%;
          background: var(--color-secondary);
          opacity: 0.45;
        }
        .auth-orb-2 {
          width: 35vw; height: 35vw;
          bottom: -5%; left: -5%;
          background: var(--color-danger);
          opacity: 0.06;
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

        .auth-aside {
          display: none;
          flex: 0 0 42%;
          background: var(--color-primary);
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
        }
        .aside-quote {
          font-family: var(--font-heading);
          font-style: italic;
          font-size: clamp(1.8rem, 2.5vw, 2.8rem);
          color: white;
          line-height: 1.3;
          opacity: 0.92;
        }
        .aside-quote em { opacity: 1; font-style: italic; }
        .aside-petals {
          display: flex;
          gap: 1rem;
          font-size: 2rem;
          filter: brightness(1.1);
        }

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
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1.5rem;
          overflow: hidden;
          box-shadow: 0 4px 20px -8px var(--color-shadow);
        }
        .auth-input {
          width: 100%;
          padding: 1rem 1.2rem;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--color-border);
          outline: none;
          font-family: var(--font-body);
          font-size: 0.95rem;
          color: var(--color-text);
          text-align: center;
          transition: background 0.2s;
        }
        .auth-input:last-child { border-bottom: none; }
        .auth-input::placeholder { color: var(--color-text-muted); font-style: italic; }
        .auth-input:focus { background: var(--color-background); }

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
        .auth-divider::before, .auth-divider::after {
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

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}