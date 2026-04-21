'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserRepository } from '@/lib/repositories/UserRepository';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { Loader2, Check, ArrowLeft } from 'lucide-react';
import { Profile } from '@/types';

export default function SettingsPage() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');

  const router = useRouter();
  const supabase = createClient();
  const userRepo = new UserRepository();

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      setUser({ id: user.id, email: user.email || '' });
      if (user.app_metadata?.providers?.includes('google')) {
        setIsGoogleAuth(true);
      }
      const p = await userRepo.findById(user.id);
      if (p) {
        setProfile(p);
        setDisplayName(p.display_name || '');
        setInstagram(p.instagram || '');
        setLinkedin(p.linkedin || '');
        setGithub(p.github || '');
      }
      setLoading(false);
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true); setSaved(false);
    try {
      await userRepo.updateDisplayName(profile.id, displayName);
      await userRepo.updateSocials(profile.id, {
        instagram: instagram || undefined,
        linkedin: linkedin || undefined,
        github: github || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error('Failed to save settings:', err); }
    finally { setSaving(false); }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setSecurityError(''); setSecuritySuccess('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${globalThis.location.origin}/auth/callback?next=/settings` });
      if (error) setSecurityError(error.message);
      else setSecuritySuccess('Password reset link sent to your email.');
    } catch (err) { setSecurityError(err instanceof Error ? err.message : 'Failed to send reset email.'); }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id || confirmText !== 'DELETE') {
      setSecurityError('Please type DELETE to confirm.');
      return;
    }

    setDeleteLoading(true);
    setSecurityError('');
    setSecuritySuccess('');

    try {
      const { error } = await supabase.rpc('delete_user', {
        uid: user.id
      });

      if (error) {
        setSecurityError(error.message);
        setDeleteLoading(false);
        return;
      }

      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : 'Unexpected error.');
      setDeleteLoading(false);
    }
  };

  if (loading) return (
    <div className="settings-loading">
      <Loader2 size={28} className="spin" />
    </div>
  );

  const initials = displayName.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="settings-root">
      {/* Ambient */}
      <div className="settings-ambient" aria-hidden="true">
        <div className="s-orb s-orb-1" />
        <div className="s-orb s-orb-2" />
      </div>

      {/* Nav */}
      <nav className="settings-nav">
        <button onClick={() => router.push('/dashboard')} className="settings-back">
          <ArrowLeft size={16} /> back
        </button>
        <ThemeSwitcher />
      </nav>

      <main className="settings-main">

        {/* ── Profile header ── */}
        <div className="settings-profile-header">
          <div className="settings-avatar">{initials}</div>
          <div>
            <h1 className="settings-name">{displayName || 'your profile'}</h1>
            <p className="settings-email">{user?.email}</p>
          </div>
        </div>

        {/* ── Profile section ── */}
        <section className="settings-section">
          <div className="section-label">✦ &nbsp; profile</div>

          <div className="settings-field">
            <label htmlFor="display-name">display name</label>
            <input
              id="display-name"
              type="text" value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="settings-input"
              placeholder="what should we call you?"
            />
          </div>

          <div className="section-sub-label">social links</div>

          <div className="settings-field">
            <label htmlFor="instagram">instagram</label>
            <input
              id="instagram"
              type="text" value={instagram}
              onChange={e => setInstagram(e.target.value)}
              className="settings-input"
              placeholder="@yourusername"
            />
          </div>

          <div className="settings-field">
            <label htmlFor="linkedin">linkedin</label>
            <input
              id="linkedin"
              type="text" value={linkedin}
              onChange={e => setLinkedin(e.target.value)}
              className="settings-input"
              placeholder="linkedin.com/in/you"
            />
          </div>

          <div className="settings-field">
            <label htmlFor="github">github</label>
            <input
              id="github"
              type="text" value={github}
              onChange={e => setGithub(e.target.value)}
              className="settings-input"
              placeholder="github.com/you"
            />
          </div>

          <button onClick={handleSave} className="settings-save-btn" disabled={saving}>
            {saving ? (
              <Loader2 size={16} className="spin" />
            ) : saved ? (
              <><Check size={16} /> saved</>
            ) : (
              'save changes'
            )}
          </button>
        </section>

        {/* ── Appearance ── */}
        <section className="settings-section">
          <div className="section-label">🎨 &nbsp; appearance</div>
          <p className="section-desc">switch between light & dark to match your mood.</p>
          <ThemeSwitcher />
        </section>

        {/* ── Security ── */}
        <section className="settings-section settings-section--danger">
          <div className="section-label section-label--danger">🔐 &nbsp; account security</div>

          {securityError && <div className="settings-error">{securityError}</div>}
          {securitySuccess && <div className="settings-success">{securitySuccess}</div>}

          {!isGoogleAuth && (
            <>
              <div className="security-block">
                <p className="section-desc">Forgot your current password? We&apos;ll send a reset link to your inbox.</p>
                <button onClick={handlePasswordReset} className="settings-outline-btn" style={{ alignSelf: 'flex-start' }}>
                  send reset link
                </button>
              </div>

              <div className="settings-divider" />
            </>
          )}

          <div className="security-block">
            <p className="section-desc section-desc--danger">
              Deleting your account is permanent and cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)} className="settings-danger-btn">
                delete account
              </button>
            ) : (
              <div className="delete-confirm-box">
                <p>Type <strong>DELETE</strong> to confirm:</p>
                <input
                  type="text" value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  className="settings-input"
                  placeholder="DELETE"
                />
                <div className="delete-actions">
                  <button
                    onClick={handleDeleteAccount}
                    className="settings-danger-btn"
                    disabled={deleteLoading || confirmText !== 'DELETE'}
                  >
                    {deleteLoading ? <Loader2 size={16} className="spin" /> : 'confirm deletion'}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); setSecurityError(''); }}
                    className="settings-outline-btn"
                    disabled={deleteLoading}
                  >
                    cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <style>{`
        .settings-root {
          min-height: 100vh;
          background: var(--color-background);
          position: relative;
          overflow-x: hidden;
        }
        .settings-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── AMBIENT ── */
        .settings-ambient {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }
        .s-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
        }
        .s-orb-1 {
          width: 45vw; height: 45vw;
          top: -5%; right: -10%;
          background: var(--color-secondary);
          opacity: 0.4;
        }
        .s-orb-2 {
          width: 30vw; height: 30vw;
          bottom: 10%; left: -5%;
          background: var(--color-primary);
          opacity: 0.08;
        }

        /* ── NAV ── */
        .settings-nav {
          position: relative;
          z-index: 10;
          max-width: 700px;
          margin: 0 auto;
          padding: 2rem 2rem 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .settings-back {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.9rem;
          color: var(--color-text-muted);
          transition: color 0.2s;
        }
        .settings-back:hover { color: var(--color-text); }

        /* ── MAIN ── */
        .settings-main {
          position: relative;
          z-index: 1;
          max-width: 700px;
          margin: 0 auto;
          padding: 2.5rem 2rem 6rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* ── PROFILE HEADER ── */
        .settings-profile-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem 0 2.5rem;
          border-bottom: 1px solid var(--color-border);
          margin-bottom: 0.5rem;
        }
        .settings-avatar {
          width: 5rem;
          height: 5rem;
          border-radius: 1.25rem;
          background: var(--color-secondary);
          border: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-heading);
          font-style: italic;
          font-size: 2rem;
          color: var(--color-primary);
          flex-shrink: 0;
        }
        .settings-name {
          font-family: var(--font-heading);
          font-style: italic;
          font-size: 1.8rem;
          font-weight: 400;
          color: var(--color-text);
          margin-bottom: 0.2rem;
        }
        .settings-email {
          font-family: var(--font-sans);
          font-size: 0.82rem;
          color: var(--color-text-muted);
        }

        /* ── SECTION ── */
        .settings-section {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 2rem;
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          animation: fadeUp 0.5s ease both;
        }
        .settings-section--danger {
          border-color: var(--color-danger-border);
        }

        .section-label {
          font-family: var(--font-sans);
          font-size: 0.72rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }
        .section-label--danger { color: var(--color-danger); }

        .section-sub-label {
          font-family: var(--font-sans);
          font-size: 0.72rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          opacity: 0.6;
          padding-top: 0.5rem;
          border-top: 1px solid var(--color-border);
        }

        .section-desc {
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.9rem;
          color: var(--color-text-muted);
        }
        .section-desc--danger { color: var(--color-danger); opacity: 0.8; }

        /* ── FIELD ── */
        .settings-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .settings-field label {
          font-family: var(--font-sans);
          font-size: 0.78rem;
          letter-spacing: 0.06em;
          color: var(--color-text-muted);
          text-transform: lowercase;
        }
        .settings-input {
          width: 100%;
          padding: 0.85rem 1.25rem;
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: 100px;
          font-family: var(--font-body);
          font-size: 0.95rem;
          color: var(--color-text);
          outline: none;
          transition: all 0.3s ease;
        }
        .settings-input::placeholder { color: var(--color-text-muted); font-style: italic; }
        .settings-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(148,168,154,0.12);
        }

        /* ── BUTTONS ── */
        .settings-save-btn {
          align-self: flex-start;
          padding: 0.8rem 2.2rem;
          background: var(--color-text);
          color: var(--color-background);
          border: none;
          border-radius: 100px;
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.4s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .settings-save-btn:hover:not(:disabled) {
          background: var(--color-primary);
          transform: translateY(-2px);
        }
        .settings-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .settings-outline-btn {
          padding: 0.75rem 1.8rem;
          background: none;
          border: 1px solid var(--color-border);
          border-radius: 100px;
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.9rem;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .settings-outline-btn:hover:not(:disabled) {
          border-color: var(--color-text);
          color: var(--color-text);
        }
        .settings-outline-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .settings-danger-btn {
          padding: 0.75rem 1.8rem;
          background: var(--color-danger-bg);
          border: 1px solid var(--color-danger-border);
          border-radius: 100px;
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.9rem;
          color: var(--color-danger);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .settings-danger-btn:hover:not(:disabled) {
          background: var(--color-danger);
          color: white;
          border-color: var(--color-danger);
        }
        .settings-danger-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── DIVIDER ── */
        .settings-divider {
          height: 1px;
          background: var(--color-border);
          opacity: 0.5;
        }

        /* ── MESSAGES ── */
        .settings-error {
          padding: 0.9rem 1.2rem;
          background: var(--color-danger-bg);
          border: 1px solid var(--color-danger-border);
          border-radius: 1rem;
          color: var(--color-danger);
          font-family: var(--font-sans);
          font-size: 0.85rem;
        }
        .settings-success {
          padding: 0.9rem 1.2rem;
          background: rgba(148,168,154,0.1);
          border: 1px solid var(--color-primary);
          border-radius: 1rem;
          color: var(--color-primary);
          font-family: var(--font-sans);
          font-size: 0.85rem;
        }

        /* ── SECURITY ── */
        .security-block {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .delete-confirm-box {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.5rem;
          background: var(--color-danger-bg);
          border: 1px solid var(--color-danger-border);
          border-radius: 1.5rem;
        }
        .delete-confirm-box p {
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.88rem;
          color: var(--color-danger);
        }
        .delete-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}