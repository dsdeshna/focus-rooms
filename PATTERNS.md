# Architecture & Design Patterns

This document provides a technical walkthrough of the 8 design patterns implemented in Focus Rooms — 6 software design patterns and 2 cloud computing architectures. Each section explains the problem the pattern solves, where it lives in the codebase, and how the implementation works in practice.

---

## Software Design Patterns

### 1. Singleton Pattern

**File:** [`src/lib/supabase/client.ts`](./src/lib/supabase/client.ts)

**Problem:** Creating a new Supabase client on every component mount would open redundant WebSocket connections and fragment authentication state across the browser session.

**Implementation:** The `createClient()` function maintains a module-level reference to a single `SupabaseClient` instance. On the first call, it initializes the client using `createBrowserClient()` from `@supabase/ssr`. Every subsequent call returns the same instance. This guarantees one GoTrue auth session and one Realtime connection pool across the entire client-side application.

---

### 2. Factory Pattern

**File:** [`src/lib/audio/SoundFactory.ts`](./src/lib/audio/SoundFactory.ts)

**Problem:** The audio system needs to create different types of sound generators (white noise, pink noise, brown noise, ambient loops, frequency oscillators), each with distinct initialization logic — but the UI shouldn't need to know any of that.

**Implementation:** `SoundFactory` exposes three static creation methods: `createNoise(type)`, `createFrequency(hz)`, and `createAmbient(type)`. Each returns a concrete class (`WhiteNoiseGenerator`, `PinkNoiseGenerator`, `BrownNoiseGenerator`, `FrequencyGenerator`, or `AmbientSoundPlayer`) that implements the shared `SoundGenerator` interface. The calling component never imports or references concrete classes — it works exclusively with the `SoundGenerator` contract.

---

### 3. Strategy Pattern

**File:** [`src/lib/themes/ThemeStrategy.ts`](./src/lib/themes/ThemeStrategy.ts)

**Problem:** The application supports 8 color themes, each with light and dark variants (16 total configurations). Hardcoding theme logic into components would make the system rigid and difficult to extend.

**Implementation:** Each theme is defined as a strategy object containing a complete set of CSS color tokens. The `applyTheme(themeKey, isDark)` function acts as the **Strategy Context** — it selects the appropriate strategy (theme + mode), extracts the color tokens, and applies them to `document.documentElement` as CSS custom properties. Adding a new theme requires only adding a new entry to the `baseThemes` record.

---

### 4. Observer Pattern

**File:** [`src/lib/realtime/RealtimeManager.ts`](./src/lib/realtime/RealtimeManager.ts)

**Problem:** Multiple independent UI components (Whiteboard, AudioPanel, ParticipantList, NotificationToasts) all need to react to real-time events from the same Supabase channel — but they shouldn't know about each other.

**Implementation:** `RealtimeManager` acts as the **Subject**. Components register as observers by calling `subscribeToEvents(key, callback)`, `subscribeToPresence(key, callback)`, or `subscribeToStatus(key, callback)`. When a broadcast arrives, the manager iterates through its observer maps and invokes each registered callback. Observers can unsubscribe by key, and the manager handles cleanup on disconnect. This fully decouples event producers from consumers.

---

### 5. Repository Pattern

**Files:** [`src/lib/repositories/`](./src/lib/repositories/)

- `RoomRepository.ts` — Room CRUD, participant management, background updates.
- `NoteRepository.ts` — Sticky note persistence (create, update position, delete).
- `UserRepository.ts` — Profile management and social links.
- `WhiteboardRepository.ts` — Whiteboard snapshot save/load.

**Problem:** Scattering raw Supabase queries across components creates tight coupling to the data layer and makes the codebase brittle to schema changes.

**Implementation:** Each repository class encapsulates all database operations for a specific domain entity. Components interact with repositories through clean method signatures (`roomRepo.findByCode(code)`, `noteRepo.create(roomId, userId, content)`) without ever importing or referencing `@supabase/supabase-js` directly. If the underlying data source changed, only the repository internals would need to be updated.

---

### 6. Command Pattern

**File:** [`src/components/room/Whiteboard.tsx`](./src/components/room/Whiteboard.tsx)

**Problem:** Drawing on a whiteboard involves continuous mouse/touch events that need to be replicated on remote clients in real time. Simply mirroring raw events would be unreliable and tightly coupled to screen coordinates.

**Implementation:** Each drawing stroke is serialized into a command object containing normalized coordinates (`from`, `to`), `color`, and `brushSize`. These commands are broadcast via `RealtimeManager` to all room participants. Remote clients receive the command and execute it locally using the `drawSegment()` function. The same pattern applies to `clear` commands (full canvas reset) and `full-sync` commands (complete canvas snapshot for new joiners). Commands are self-contained, replay-safe, and resolution-independent.

---

## Cloud Computing Patterns

### 7. Serverless Architecture

Focus Rooms runs on a fully serverless infrastructure:

- **Frontend & API:** Next.js deployed on **Vercel** as serverless edge functions. Each API route (`/auth/callback`, etc.) runs as an isolated function that scales to zero when idle.
- **Database & Auth:** **Supabase** provides PostgreSQL, GoTrue authentication, and Row Level Security — all managed as a Backend-as-a-Service (BaaS).
- **Media Signaling:** WebRTC signaling is handled through Supabase Realtime broadcast (no signaling server needed).

There is no traditional server to provision, patch, or scale. The entire system is stateless and horizontally scalable by default.

---

### 8. Event-Driven Architecture

All real-time collaboration in Focus Rooms follows an event-driven model powered by **Supabase Realtime** (Pub/Sub):

- **Whiteboard events:** Draw strokes, canvas clears, and sync requests are broadcast as typed events to a room-scoped channel.
- **Presence events:** Participant join/leave, mic state, and display names are tracked via Supabase Presence, with automatic sync on reconnection.
- **Atmosphere events:** Audio toggle, volume change, and frequency updates are broadcast so all participants share the same soundscape.

Producers and consumers are fully decoupled. A component broadcasting `atmosphere-changed` has no knowledge of which (or how many) components are listening. This makes the system extensible — adding a new real-time feature requires only subscribing a new observer to the existing event bus.
