# Setup & Deployment Guide

This guide walks through everything you need to get Focus Rooms running locally and deployed to production. The stack is straightforward — Next.js on the frontend, Supabase on the backend, and Vercel for hosting.

---

## Prerequisites

Make sure you have the following ready before you start:

- **Node.js 18+** — [Download here](https://nodejs.org/) if you don't have it.
- **npm** — Ships with Node.js.
- **A Supabase account** — Free tier at [supabase.com](https://supabase.com).
- **A Vercel account** (for deployment) — Free tier at [vercel.com](https://vercel.com).
- **Git** — For version control and deployment.

---

## 1. Supabase Configuration

Focus Rooms uses Supabase for authentication, database storage, real-time event broadcasting, and Row Level Security.

### Create a Project
1. Log into your [Supabase Dashboard](https://app.supabase.com).
2. Click **New Project**, give it a name, and set a secure database password.
3. Wait for the project to finish provisioning (usually takes about a minute).

### Initialize the Database Schema
1. In the left sidebar, navigate to **SQL Editor**.
2. Click **New Query**.
3. Open the [`supabase-schema.sql`](./supabase-schema.sql) file from the root of this repository and copy its contents.
4. Paste the SQL into the editor and click **Run**.

This will create all required tables (`rooms`, `profiles`, `room_participants`, `room_notes`, `whiteboard_state`), enable Row Level Security policies, and set up the necessary triggers.

### Retrieve Your API Keys
1. Go to **Project Settings** → **API**.
2. Copy these two values — you'll need them in the next step:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **Anon / Public key** (a long JWT string)

### Enable Realtime
1. Go to **Database** → **Replication** in the Supabase dashboard.
2. Make sure Realtime is enabled for the tables that need it (or leave it enabled globally).

---

## 2. Local Development Setup

### Clone the Repository
```bash
git clone https://github.com/your-username/focus-rooms.git
cd focus-rooms
```

### Install Dependencies
```bash
npm install
```

### Configure Environment Variables
Create a `.env.local` file in the project root with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

> **Note:** These are public-facing keys (they're safe to expose in client-side code). Supabase enforces security through Row Level Security policies, not by hiding the anon key.

### Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the landing page.

---

## 3. Deployment on Vercel

### Push to GitHub
If you haven't already, initialize a Git repository and push to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/focus-rooms.git
git push -u origin main
```

### Connect to Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New** → **Project**.
3. Import your GitHub repository.
4. In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon key
5. Click **Deploy**.

Vercel will build and host your application automatically. Every push to `main` will trigger a new deployment.

---

## 4. Troubleshooting

### WebRTC / Audio Issues
- WebRTC requires a **secure context** (HTTPS). Vercel provides this automatically. For local development, `localhost` is treated as secure by browsers.
- If voice chat doesn't connect across networks, the TURN relay servers may be rate-limited. Consider configuring your own TURN server (e.g., via [Metered](https://www.metered.ca/) or [Twilio](https://www.twilio.com/stun-turn)) for production use.
- On mobile browsers, audio playback requires a user gesture before the browser will allow it. The app handles this with an "Enable Sound" overlay.

### Realtime Sync Issues
- If whiteboard strokes or presence aren't syncing, verify that Supabase Realtime is enabled in your project settings.
- Check the browser console for `[Realtime]` prefixed logs — they'll tell you whether the channel connected successfully.

### Database Issues
- If you get permission errors, double-check that your RLS policies were created correctly by re-running `supabase-schema.sql`.
- Make sure you're using the **anon key** (not the service role key) in your `.env.local`.

---

## 5. Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/               # Login, signup, OAuth callback
│   ├── dashboard/          # Room management dashboard
│   ├── room/[code]/        # Main collaborative room view
│   └── settings/           # User profile settings
├── components/
│   ├── room/               # AudioPanel, Whiteboard, StickyNotes, etc.
│   └── theme/              # ThemeProvider, ThemeSwitcher
├── lib/
│   ├── audio/              # SoundFactory (Factory Pattern)
│   ├── realtime/           # RealtimeManager (Observer Pattern)
│   ├── repositories/       # Data access layer (Repository Pattern)
│   ├── supabase/           # Client & server Supabase instances
│   ├── themes/             # ThemeStrategy (Strategy Pattern)
│   ├── utils/              # Image compression helpers
│   └── webrtc/             # PeerManager (WebRTC mesh)
└── types/                  # Shared TypeScript interfaces
```
