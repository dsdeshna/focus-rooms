import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { LogOut, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';


export function Header({ user }: { user?: { name: string; email: string } | null }) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/'} className="header-logo">
            <span
              className="logo-leaf"
              style={{ color: 'var(--color-primary)' }}
            >
              ۶۟ৎ
            </span>
            <span className="logo-text">focus rooms</span>
          </Link>

          {/* Right side */}
          <nav className="header-nav">
            <ThemeSwitcher />

            {user ? (
              <>
                <span className="header-name">{user.name}</span>
                <button
                  onClick={() => router.push('/settings')}
                  className="header-icon-btn"
                  title="Settings"
                  aria-label="Settings"
                >
                  <Settings size={16} strokeWidth={1.5} />
                </button>
                <button
                  onClick={handleLogout}
                  className="header-icon-btn header-icon-btn--danger"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut size={16} strokeWidth={1.5} />
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="header-link">
                  sign in
                </Link>
                <Link href="/auth/signup" className="header-pill">
                  join us
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <style>{`
        .site-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 0 2rem;
        }

        .header-inner {
          max-width: 1100px;
          margin: 0 auto;
          height: 5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          padding: 0 1rem;
        }

        /* Frosted glass blur behind header */
        .header-inner::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 0 0 1.5rem 1.5rem;
          background: var(--color-background);
          opacity: 0.75;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: -1;
          border-bottom: 1px solid var(--color-border);
        }

        /* ── LOGO ── */
        .header-logo {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .header-logo:hover { opacity: 0.75; }

        .logo-leaf {
          font-size: 1.3rem;
          line-height: 1;
          display: inline-block;
          transition: transform 0.5s ease;
        }
        .header-logo:hover .logo-leaf {
          transform: rotate(-12deg) scale(1.1);
        }

        .logo-text {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--color-text);
          letter-spacing: 0.01em;
        }

        /* ── NAV ── */
        .header-nav {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-name {
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.9rem;
          color: var(--color-text-muted);
          display: none;
        }
        @media (min-width: 600px) {
          .header-name { display: inline; }
        }

        .header-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 50%;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .header-icon-btn:hover {
          background: var(--color-primary);
          color: var(--color-text-on-primary);
          border-color: var(--color-primary);
          transform: scale(1.05);
        }
        .header-icon-btn--danger:hover {
          background: var(--color-danger-bg);
          color: var(--color-danger);
          border-color: var(--color-danger-border);
        }

        .header-link {
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.9rem;
          color: var(--color-text-muted);
          text-decoration: none;
          transition: color 0.2s;
        }
        .header-link:hover { color: var(--color-text); }

        .header-pill {
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.9rem;
          color: var(--color-text-on-primary);
          background: var(--color-primary);
          text-decoration: none;
          padding: 0.5rem 1.3rem;
          border-radius: 100px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px -3px rgba(148,168,154,0.3);
        }
        .header-pill:hover {
          background: var(--color-primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 8px 20px -5px rgba(148,168,154,0.4);
        }
      `}</style>
    </>
  );
}