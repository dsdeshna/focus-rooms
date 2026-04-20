'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Pencil } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="landing-root">
      <Header />

      {/* Ambient background */}
      <div className="ambient" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grain" />
      </div>

      <main>
        {/* ── Hero ── */}
        <section className="hero">
          <div className="hero-eyebrow">
            <span className="dot" />
            <span>stay a while. do something. maybe. </span>
          </div>

          <h1 className="hero-title">
            a room for you to<br />
            <em>figure things out.</em>
          </h1>

          <p className="hero-sub">
            where you and your people come to focus, or at least try to :) <br></br>but it's okay, you don’t have to be productive here.
          </p>

          <div className="hero-cta">
            <button className="btn-enter" onClick={() => router.push('/auth/signup')}>
               create an account
            </button>
            <button className="btn-ghost" onClick={() => router.push('/auth/login')}>
              already a member →
            </button>
          </div>

        </section>

        {/* ── Marquee ribbon ── */}
        <div className="ribbon" aria-hidden="true">
          <div className="ribbon-track">
            {['study together', '✦', 'shared canvas', '✦', 'real-time sync', '✦', 'ambient sound', '✦', 'synced whiteboard', '✦', 'sticky notes', '✦'].map((t, i) => (
              <span key={i}>{t}</span>
            ))}
            {['study together', '✦', 'shared canvas', '✦', 'real-time sync', '✦', 'ambient sound', '✦', 'synced whiteboard', '✦', 'sticky notes', '✦'].map((t, i) => (
              <span key={`r-${i}`} aria-hidden="true">{t}</span>
            ))}
          </div>
        </div>

        {/* ── Features ── */}
        <section className="features">
          <div className="feature-label">inside,</div>

          <div className="feature-grid">
            <article className="feature-card feature-card--accent">
              <div className="feature-num">01</div>
              <div className="feature-icon">✏️</div>
              <h3>blank canvas</h3>
              <p>
                a whiteboard where you can draw, write, erase and go crazy PLUS 
                it all syncs in real time, so you’re on it together.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-num">02</div>
              <div className="feature-icon">🔮</div>
              <h3>clarity</h3>
              <p>
                real time background and sound sharing so you 
                see what your friend is seeing. no lag. nada. 
                just open the room and stay on the same page.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-num">03</div>
              <div className="feature-icon">🌿</div>
              <h3>your space</h3>
              <p>
                make it feel like your room with
                soft sounds, different scenes  
                whatever helps your brain settle down a bit.
              </p>
            </article>

            <article className="feature-card feature-card--accent">
              <div className="feature-num">04</div>
              <div className="feature-icon">💌</div>
              <h3>sticky notes</h3>
              <p>
                leave notes like you would on a desk -  
                small things, important things, 
                things you’ll forget otherwise, you know :)
              </p>
            </article>
          </div>
        </section>

        {/* ── Quote interlude ── */}
        <section className="interlude">
          <blockquote>
            "good ideas show up when it’s quiet, or when you’re supposed to be doing something else"
          </blockquote>
          <cite>— speaking from experience, unfortunately</cite>
        </section>

        {/* ── Footer ── */}
        <footer className="site-footer">
          <span>we made a thing, be nice to it &hearts; deshna & raksha</span>
        </footer>
      </main>

      <style>{`
        /* ── ROOT ── */
        .landing-root {
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
        }

        /* ── AMBIENT ── */
        .ambient {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
          animation: drift 20s ease-in-out infinite alternate;
        }
        .orb-1 {
          width: 55vw; height: 55vw;
          top: -15%; right: -10%;
          background: var(--color-secondary);
          animation-delay: 0s;
        }
        .orb-2 {
          width: 40vw; height: 40vw;
          bottom: 5%; left: -8%;
          background: var(--color-primary);
          opacity: 0.12;
          animation-delay: -7s;
        }
        .orb-3 {
          width: 30vw; height: 30vw;
          top: 40%; left: 40%;
          background: var(--color-danger);
          opacity: 0.06;
          animation-delay: -13s;
        }
        .grain {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 256px;
          opacity: 0.4;
        }
        @keyframes drift {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(3%, 5%) scale(1.08); }
        }

        /* ── HERO ── */
        main { position: relative; z-index: 1; }

        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 8rem 2rem 6rem;
          position: relative;
        }

        .hero-eyebrow {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-family: var(--font-sans);
          font-size: 0.78rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin-bottom: 2.5rem;
          animation: fadeUp 0.8s ease both;
        }
        .dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--color-primary);
          display: inline-block;
        }

        .hero-title {
          font-family: var(--font-heading);
          font-size: clamp(3.2rem, 8vw, 7rem);
          font-weight: 500;
          line-height: 1.08;
          color: var(--color-text);
          margin-bottom: 2rem;
          animation: fadeUp 0.9s 0.1s ease both;
        }
        .hero-title em {
          font-style: italic;
          color: var(--color-primary);
        }

        .hero-sub {
          font-family: var(--font-body);
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: var(--color-text-muted);
          max-width: 560px;
          line-height: 1.8;
          margin-bottom: 3.5rem;
          animation: fadeUp 1s 0.2s ease both;
        }

        .hero-cta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.4rem;
          animation: fadeUp 1s 0.35s ease both;
        }

        @media (min-width: 500px) {
          .hero-cta { flex-direction: row; }
        }

        .btn-enter {
          font-family: var(--font-body);
          font-size: 1rem;
          font-style: italic;
          background: var(--color-text);
          color: var(--color-background);
          border: none;
          border-radius: 100px;
          padding: 1rem 2.8rem;
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          box-shadow: 0 8px 30px -8px rgba(74,69,67,0.3);
        }
        .btn-enter:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 40px -10px rgba(74,69,67,0.35);
          background: var(--color-primary);
        }
        .btn-enter--large {
          font-size: 1.15rem;
          padding: 1.2rem 3.5rem;
        }

        .btn-ghost {
          font-family: var(--font-body);
          font-size: 0.95rem;
          color: var(--color-text-muted);
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.3s;
          font-style: italic;
        }
        .btn-ghost:hover { color: var(--color-text); }

        .hero-scroll-hint {
          position: absolute;
          bottom: 2.5rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-sans);
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          opacity: 0.5;
          animation: fadeUp 1s 0.8s ease both;
        }
        .scroll-line {
          width: 1px;
          height: 40px;
          background: linear-gradient(to bottom, var(--color-text-muted), transparent);
          animation: scrollPulse 2s ease-in-out infinite;
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.3; transform: scaleY(1); }
          50% { opacity: 0.8; transform: scaleY(1.1); }
        }

        /* ── RIBBON ── */
        .ribbon {
          overflow: hidden;
          border-top: 1px solid var(--color-border);
          border-bottom: 1px solid var(--color-border);
          padding: 1rem 0;
          background: var(--color-surface);
        }
        .ribbon-track {
          display: flex;
          gap: 2.5rem;
          white-space: nowrap;
          animation: scroll-left 25s linear infinite;
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.9rem;
          color: var(--color-text-muted);
        }
        @keyframes scroll-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        /* ── FEATURES ── */
        .features {
          padding: 4rem 2rem;
          max-width: 1100px;
          margin: 0 auto;
        }
        .feature-label {
          font-family: var(--font-sans);
          font-size: 0.72rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin-bottom: 4rem;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto auto;
          gap: 1.5rem;
        }
        @media (max-width: 640px) {
          .feature-grid { grid-template-columns: 1fr; }
        }

        .feature-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 2rem;
          padding: 2.5rem;
          transition: transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1),
                      box-shadow 0.5s ease;
          position: relative;
          overflow: hidden;
        }
        .feature-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at top left, var(--color-secondary) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.5s;
        }
        .feature-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 50px -15px var(--color-shadow-lg);
        }
        .feature-card:hover::before { opacity: 0.3; }

        .feature-card--accent {
          background: var(--color-secondary);
        }

        .feature-num {
          font-family: var(--font-sans);
          font-size: 0.7rem;
          letter-spacing: 0.18em;
          color: var(--color-text-muted);
          margin-bottom: 2rem;
        }
        .feature-icon {
          font-size: 2rem;
          margin-bottom: 1.2rem;
          line-height: 1;
        }
        .feature-card h3 {
          font-family: var(--font-heading);
          font-size: 1.6rem;
          font-weight: 500;
          margin-bottom: 0.8rem;
          color: var(--color-text);
        }
        .feature-card p {
          font-family: var(--font-body);
          font-size: 0.95rem;
          color: var(--color-text-muted);
          line-height: 1.75;
        }

        /* ── INTERLUDE ── */
        .interlude {
          padding: 4rem 2rem 6rem;
          text-align: center;
          position: relative;
        }
        .interlude blockquote {
          font-family: var(--font-heading);
          font-style: italic;
          font-size: clamp(1.8rem, 4vw, 3rem);
          color: var(--color-text);
          max-width: 700px;
          margin: 0 auto 1.5rem;
          line-height: 1.4;
        }
        .interlude cite {
          font-family: var(--font-body);
          font-size: 0.85rem;
          color: var(--color-text-muted);
          letter-spacing: 0.08em;
          font-style: normal;
        }

        /* ── FINAL CTA ── */
        .final-cta {
          padding: 6rem 2rem 8rem;
          text-align: center;
        }
        .final-cta h2 {
          font-family: var(--font-heading);
          font-size: clamp(2rem, 5vw, 4rem);
          font-weight: 400;
          font-style: italic;
          margin-bottom: 1rem;
        }
        .final-cta p {
          font-family: var(--font-body);
          color: var(--color-text-muted);
          margin-bottom: 3rem;
          font-size: 1.05rem;
        }

        /* ── FOOTER ── */
        .site-footer {
          border-top: 1px solid var(--color-border);
          padding: 2rem;
          text-align: center;
          font-family: var(--font-sans);
          font-size: 0.8rem;
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }
        .footer-dot { opacity: 0.4; }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}