# Focus Rooms

**A real-time collaborative workspace built for deep focus and creative flow.**

Focus Rooms is a full-stack web application that allows people to study/focus together by including ambient sound design, shared whiteboards, peer-to-peer voice communication, and real-time presence, along with the interface inspired by the soft, editorial aesthetic of platforms like Pinterest and Tumblr.

This project was built as a practical exploration of **6 Software Design Patterns** and **2 Cloud Computing Architectures**, to help the project be maintainable, scalable, and genuinely pleasant to use.

---

## What It Does

At its core, Focus Rooms lets you create private, shareable rooms where you and your friends or teammates can focus together in real time. It's not a meeting tool, it's a _space_. You join, you settle in, and you work.

### Atmospheric Audio Engine

The audio system is built entirely on the **Web Audio API**, generating noise programmatically rather than streaming static files. You get:

- **White, Pink, and Brown noise generators** — synthesized in real time using cryptographically seeded buffers.
- **Ambient soundscapes** — Rain, Forest, Café, Ocean, Fireplace, and Wind loops for environmental immersion.
- **A frequency tuner** — A sine-wave oscillator tunable from 20Hz to 2000Hz, with preset slots for common Solfeggio frequencies (432Hz, 528Hz, etc.).
- **Synchronized atmosphere** — When one person changes the soundscape, everyone in the room hears it. The audio state is broadcast in real time using Supabase Realtime channels.

### Shared Whiteboard

A collaborative canvas for brainstorming, sketching, and visual thinking:

- **Resolution-independent sync** — Drawing coordinates are normalized (0–1) so the whiteboard works identically across different screen sizes.
- **Leader-based state handoff** — When a new participant joins, the room's leader automatically sends them a full canvas snapshot, so nobody walks into a blank board.
- **Export to PNG** — Save your whiteboard locally at any point (Download to your device).

### Peer-to-Peer Voice

Voice communication is handled via **WebRTC** with a full mesh topology:

- **STUN + TURN** — Configured with public relay servers for cross-network connectivity.
- **Perfect Negotiation** — Implements the W3C "perfect negotiation" pattern to eliminate race conditions during SDP exchange.
- **Echo cancellation, noise suppression, and auto gain** — Enabled by default on all audio tracks.

### Private Sticky Notes

Each participant gets their own set of draggable, pastel-toned sticky notes that persist across sessions. Notes are private — enforced at the database level via Supabase Row Level Security. Nobody else in the room can see yours.

### Theming System

Eight curated color palettes — Lavender Dream (Purple), Rose Garden (Pink), Ocean Breeze (Blue), Sage Meadow (Green), Honey Glow (Yellow), Sunset Ember (Orange), Cherry Blossom (Red), and Mocha Cream (Brown) — each with dedicated light and dark variants. Themes are applied at runtime by swapping CSS custom property tokens, implemented via the Strategy pattern.

---

## Tech Stack

| Layer           | Technology                  | Why                                                                                   |
| :-------------- | :-------------------------- | :------------------------------------------------------------------------------------ |
| **Framework**   | Next.js 14 (App Router)     | Server components, file-based routing, edge-ready deployment.                         |
| **Language**    | TypeScript                  | End-to-end type safety across client and server.                                      |
| **Styling**     | Tailwind CSS + Custom CSS   | Utility-first base with hand-tuned glassmorphism, animations, and theme tokens.       |
| **Database**    | Supabase (PostgreSQL)       | Managed relational database with built-in Auth, RLS, and Realtime.                    |
| **Real-Time**   | Supabase Realtime (Pub/Sub) | Low-latency event broadcasting for whiteboard strokes, presence, and atmosphere sync. |
| **Voice/Media** | WebRTC                      | Direct peer-to-peer audio — no media server needed.                                   |
| **Deployment**  | Vercel                      | Serverless hosting with automatic CI/CD from GitHub.                                  |

---

## Design Patterns & Architecture

This codebase is structured around 8 deliberate design patterns. Each one solves a specific problem in the architecture, and none of them are there for the sake of it.

> For a complete technical breakdown (including file paths, class names, and implementation details) see **[PATTERNS.md](./PATTERNS.md)**.

### Software Patterns

1. **Observer** — The `RealtimeManager` acts as a subject that notifies registered UI observers when real-time events arrive.
2. **Factory** — `SoundFactory` encapsulates audio generator creation, so the UI never needs to know about `WhiteNoiseGenerator` vs `PinkNoiseGenerator`.
3. **Strategy** — Theme palettes are interchangeable strategies applied at runtime via CSS custom properties.
4. **Repository** — All database access goes through repository classes (`RoomRepository`, `NoteRepository`, etc.), keeping Supabase queries out of components.
5. **Singleton** — The Supabase browser client is instantiated once and reused globally, preventing duplicate connections.
6. **Command** — Whiteboard drawing actions are serialized into command objects and broadcast for remote replay.

### Cloud Patterns

7. **Serverless Architecture** — The entire backend runs on Vercel serverless functions and Supabase BaaS. No traditional server to manage.
8. **Event-Driven Architecture** — All collaboration features (whiteboard, presence, atmosphere) communicate through a Pub/Sub event bus.

---

## Getting Started

Full setup instructions — including Supabase configuration and Vercel deployment — are documented in **[SETUP.md](./SETUP.md)**.

**Quick start:**

```bash
git clone https://github.com/your-username/focus-rooms.git
cd focus-rooms
npm install
# Add your Supabase keys to .env.local (see SETUP.md)
npm run dev
```

---

## Typography & Visual Identity

The interface uses two serif typefaces to set a calm, editorial tone:

- **Playfair Display** for headings — refined and expressive.
- **Lora** for body text — warm, readable, and contemporary.

The color system is built on CSS custom properties that update dynamically when you switch themes. Every palette maintains consistent contrast ratios across light and dark modes, ensuring the interface stays legible and pretty regardless of the user's preference.
