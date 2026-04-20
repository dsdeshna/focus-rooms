# 🌸 Focus Rooms

A collaborative focus room web application where people can join rooms, share whiteboards, play ambient sounds, talk via mic, share their screens, and take personal notes — all wrapped in a dreamy, Tumblr-inspired pastel aesthetic.

**Built for:** Cloud Computing + Software Patterns courses  
**Deployment:** Vercel (Frontend/Next.js) + Supabase (Database/Auth/Realtime)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | Email/password + Google OAuth sign-in via Supabase Auth |
| 🚪 **Room System** | Create rooms with shareable 6-character codes, join with a code |
| 🎵 **Sound Generators** | White, pink, and brown noise generators (Web Audio API) |
| 🎚️ **Frequency Slider** | Tunable sine wave generator (20Hz–2000Hz) with preset frequencies |
| 🌧️ **Ambient Sounds** | Rain, café, forest, ocean, fireplace, wind |
| 🎤 **Voice Chat** | Toggle mic for real-time voice communication (WebRTC peer-to-peer) |
| 🖼️ **Screen Sharing** | Share your screen with all room participants (WebRTC) |
| 🎨 **Collaborative Whiteboard** | Draw together with color picker and adjustable brush sizes |
| 📥 **Save Whiteboard** | Download the whiteboard as a PNG image |
| 📝 **Sticky Notes** | Personal, translucent, draggable notes visible only to you |
| 🔔 **Notifications** | Toast notifications when someone joins or opens the whiteboard |
| 👥 **Participant List** | Zoom-style list with mic on/off indicators |
| 🖼️ **Custom Backgrounds** | Upload a background image for the room |
| 🎨 **8 Color Themes** | Switch between 8 distinct pastel themes (Strategy Pattern) |
| ⚙️ **Account Settings** | Edit display name, link Instagram/LinkedIn/GitHub |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS + Custom CSS (glassmorphism, animations) |
| Fonts | Playfair Display + Lora (Google Fonts) |
| Auth & DB | Supabase (PostgreSQL + GoTrue) |
| Real-time | Supabase Realtime (Broadcast + Presence) |
| Voice & Video | WebRTC (peer-to-peer) with Supabase signaling |
| Whiteboard | Fabric.js (HTML5 Canvas) |
| Audio | Web Audio API (noise generators, oscillator) |
| Deployment | **Vercel** (Frontend) + **Supabase Engine** (Backend) |

> 💡 **Why Vercel & Supabase?** You might also optionally use Railway for the Postgres backend if you wish to self-host Supabase services. However, connecting directly to Supabase cloud is fundamentally completely "Serverless", which maps seamlessly to our core cloud patterns!

---

## 🧩 Design & Cloud Patterns

This project implements **6 software design patterns** and **2 cloud computing patterns**. Every pattern is clearly marked in the code with comments.

See [`PATTERNS.md`](./PATTERNS.md) for a complete guide with exact file locations.

| # | Pattern | Type |
|---|---------|------|
| 1 | Observer | Software — Behavioral |
| 2 | Factory | Software — Creational |
| 3 | Strategy | Software — Behavioral |
| 4 | Repository | Software — Structural |
| 5 | Singleton | Software — Creational |
| 6 | Command | Software — Behavioral |
| 7 | Serverless Architecture | Cloud |
| 8 | Event-Driven Architecture | Cloud Architecture |

---

## 🚀 Step-by-Step Setup Instructions

For an expanded set of step-by-step guidance including screenshots and exact navigation sequences, refer to [`SETUP.md`](./SETUP.md) located in this directory. 

### Prerequisites

- **Node.js** 18+ installed ([download](https://nodejs.org))
- **npm** (comes with Node.js)
- A **Supabase** account (Free tier: [supabase.com](https://supabase.com))
- A **Vercel** account (Free tier: [vercel.com](https://vercel.com))

### 1. Database & Authentication (Supabase)

1. Create a project at [Supabase](https://supabase.com).
2. Grab your environment variables from **Project Settings → API**:
   - `Project URL` → Map to `NEXT_PUBLIC_SUPABASE_URL`
   - `anon / public key` → Map to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Go to the **SQL Editor**, launch a **New Query**, and paste the full contents of [`supabase-schema.sql`](./supabase-schema.sql), then click **Run**.
4. (Optional) Setup Google login by going to **Authentication → Providers**. Create an OAuth App inside Google Cloud Console and paste the secret/ID into Supabase.

### 2. Local Environment Configuration

```bash
# Clone the repository
git clone https://github.com/yourusername/focus-rooms.git
cd focus-rooms

# Install dependencies
npm install

# Prepare environment values
cp .env.example .env.local
```

Inside `.env.local`, map in the Supabase Variables you extracted during step 1.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run Development Server locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and test the application securely.

---

## ☁️ Deployment (Vercel)

This application is strictly optimized for **Vercel** deployment with zero-config edge rendering!

### 1. Upload to GitHub
Initialize your repo and push your code.
```bash
git init
git add .
git commit -m "feat: initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/focus-rooms-app.git
git push -u origin main
```

### 2. Vercel Hookup
1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New** → **Project**, and import your newly created GitHub repository.
3. Once imported, locate the **Environment Variables** drop down before clicking deploy.
4. Input the two keys (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
5. Hit **Deploy** and wait less than a minute. Your app is officially live on a `.vercel.app` domain!

### Wait, what about Railway?
If you would like to run the databases via Railway, you could spin up a PostgreSQL instance there. However, Focus Rooms specifically needs **Supabase Realtime** for the Event-Driven architectural patterns (Whiteboards, P2P signaling). Supabase Cloud is highly recommended since self-hosting the full Supabase suite requires spinning up Docker nodes on Railway individually.

---

## 🎨 Color Themes

| Theme | Colors |
|-------|--------|
| 🌸 Lavender Dream | Soft purple/lilac |
| 🌹 Rose Garden | Pink/rose |
| 🌊 Ocean Breeze | Cool blue |
| 🌿 Sage Meadow | Earthy green |
| 🌻 Honey Glow | Warm golden/amber |
| 🧡 Sunset Ember | Coral/warm |
| 🌙 Midnight Muse | Dark navy |
| ☕ Mocha Cream | Warm brown/beige |

---

## 📁 Repository Structure Overview

```
focus-rooms/
├── public/                         # Static assets (sounds, etc.)
├── src/
│   ├── app/
│   │   ├── auth/                   # Authentication gateways
│   │   ├── dashboard/page.tsx      # Main dashboard logic
│   │   ├── room/[code]/page.tsx    # Sub-room WebRTC/Realtime layout
│   │   ├── settings/page.tsx       # Auth profile edits
│   │   ├── layout.tsx              # Root HTML logic
│   │   ├── page.tsx                # Landing
│   │   └── globals.css             # Utilities (Tailwind wrapper)
│   ├── components/                 # Isolated React Components (Whiteboard, Audio, Themes)
│   ├── lib/
│   │   ├── supabase/               # Pattern: Singleton DB Accessors
│   │   ├── audio/                  # Pattern: Factory Audio Interfaces
│   │   ├── themes/                 # Pattern: Strategy Themer
│   │   ├── realtime/               # Pattern: Event-Driven Observer Logic
│   │   ├── repositories/           # Pattern: Repository database proxies
│   │   └── webrtc/                 # P2P mesh logic (Vanilla)
│   └── proxy.ts                    # Routing & server-shield logic
├── .env.example                    # Env var scaffold
├── PATTERNS.md                     # Software & Cloud definitions
├── SETUP.md                        # Expanded instructional list
├── README.md                       # High Level Overview
└── supabase-schema.sql             # Live database blueprint
```
