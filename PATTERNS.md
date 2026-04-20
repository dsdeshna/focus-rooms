# 🧩 Design Patterns & Cloud Patterns — Focus Rooms

This document explains every software design pattern and cloud computing pattern implemented in this project, with exact file locations and descriptions.

---

## Software Design Patterns

### 1. 🔔 Observer Pattern

**What it is:** A behavioral pattern where an object (Subject) maintains a list of dependents (Observers) and notifies them automatically of any state changes.

**Where it's implemented:**

| File | Description |
|------|-------------|
| `src/lib/realtime/RealtimeManager.ts` | **Primary implementation.** The `RealtimeManager` is the Subject. It maintains `eventObservers`, `presenceObservers`, and `statusObservers` Maps. Components register via `subscribeToEvents()` and `subscribeToPresence()`. When a broadcast event arrives from Supabase Realtime, the `notifyEventObservers()` method iterates through all registered observers and calls their callbacks. |
| `src/app/room/[code]/page.tsx` | **Observer registration.** The room page registers as an observer for notifications (`'notifications'` observer) and participant list updates (`'participants'` observer). It receives events like `whiteboard-opened`, `participant-joined`, `participant-left`, `background-changed`. |
| `src/components/room/Whiteboard.tsx` | **Observer registration.** The whiteboard registers as an observer (`'whiteboard'` observer) to receive remote draw commands from other users. |

**How it works in the app:**
1. When a user joins a room, the `RealtimeManager` connects to a Supabase Realtime channel.
2. Multiple components register as observers (notifications, whiteboard, participants).
3. When ANY user broadcasts an action, Supabase Realtime delivers it to all connected clients.
4. The `RealtimeManager` receives the event and notifies ALL registered observers.
5. Each observer handles the event independently (e.g., notifications show a toast, whiteboard draws remotely).

---

### 2. 🏭 Factory Pattern

**What it is:** A creational pattern that provides an interface for creating objects without specifying their concrete classes. The factory method encapsulates object creation logic.

**Where it's implemented:**

| File | Description |
|------|-------------|
| `src/lib/audio/SoundFactory.ts` | **Primary implementation.** The `SoundFactory` class has three factory methods: `createNoise(type)` creates WhiteNoiseGenerator, PinkNoiseGenerator, or BrownNoiseGenerator; `createFrequency(freq)` creates a FrequencyGenerator; `createAmbient(type)` creates an AmbientSoundPlayer. All products implement the `SoundGenerator` interface. |
| `src/components/room/AudioPanel.tsx` | **Factory usage.** The AudioPanel calls `SoundFactory.createNoise('white')`, `SoundFactory.createAmbient('rain')`, etc. It never directly instantiates concrete generator classes. |

**Products created by the factory:**
- `WhiteNoiseGenerator` — Pure random audio samples
- `PinkNoiseGenerator` — Paul Kellet's refined algorithm for 1/f noise
- `BrownNoiseGenerator` — Integrated (cumulative) white noise
- `FrequencyGenerator` — Sine wave oscillator at configurable Hz
- `AmbientSoundPlayer` — HTML5 Audio playback for ambient sound files

---

### 3. 🎯 Strategy Pattern

**What it is:** A behavioral pattern that defines a family of algorithms (strategies), encapsulates each one, and makes them interchangeable at runtime.

**Where it's implemented:**

| File | Description |
|------|-------------|
| `src/lib/themes/ThemeStrategy.ts` | **Primary implementation.** Each color theme (Lavender Dream, Rose Garden, Ocean Breeze, etc.) is a concrete strategy — a `Theme` object containing a `ThemeColors` palette. The `applyTheme()` function acts as the Context, swapping the active strategy by writing CSS custom properties to `document.documentElement`. |
| `src/components/theme/ThemeSwitcher.tsx` | **Strategy switching UI.** Displays all 8 strategies and lets the user swap between them at runtime. |
| `src/components/theme/ThemeProvider.tsx` | **Context initialization.** Loads the saved strategy from localStorage and applies it on mount. |

**8 Theme Strategies:**
1. 🌸 Lavender Dream (purple)
2. 🌹 Rose Garden (pink)
3. 🌊 Ocean Breeze (blue)
4. 🌿 Sage Meadow (green)
5. 🌻 Honey Glow (golden)
6. 🧡 Sunset Ember (coral)
7. 🌙 Midnight Muse (dark)
8. ☕ Mocha Cream (brown)

---

### 4. 📦 Repository Pattern

**What it is:** A structural pattern that mediates between the domain/business logic and the data mapping layer (database). Repositories centralize data access logic so the rest of the app doesn't need to know about the database.

**Where it's implemented:**

| File | Description |
|------|-------------|
| `src/lib/repositories/RoomRepository.ts` | CRUD for rooms: `create()`, `findByCode()`, `findById()`, `joinRoom()`, `leaveRoom()`, `updateMicStatus()`, `getParticipants()`, `deactivate()`, `delete()` |
| `src/lib/repositories/UserRepository.ts` | Profile operations: `findById()`, `upsert()`, `updateDisplayName()`, `updateSocials()` |
| `src/lib/repositories/NoteRepository.ts` | Sticky notes: `findByUserAndRoom()`, `create()`, `updateContent()`, `updatePosition()`, `delete()` |
| `src/lib/repositories/WhiteboardRepository.ts` | Whiteboard snapshots: `saveSnapshot()`, `findByUser()`, `findByRoom()` |

**Used by:**
- `src/app/dashboard/page.tsx` — Uses `RoomRepository` to create/find rooms
- `src/app/room/[code]/page.tsx` — Uses `RoomRepository` to join/leave rooms, update mic status
- `src/components/room/StickyNotes.tsx` — Uses `NoteRepository` for personal notes
- `src/components/room/Whiteboard.tsx` — Uses `WhiteboardRepository` to save/download whiteboards
- `src/app/settings/page.tsx` — Uses `UserRepository` for profile updates

---

### 5. 🔒 Singleton Pattern

**What it is:** A creational pattern that restricts a class to a single instance and provides a global access point to it.

**Where it's implemented:**

| File | Description |
|------|-------------|
| `src/lib/supabase/client.ts` | The Supabase browser client is a Singleton. The `createClient()` function checks if a client instance already exists; if so, it returns the existing one. This prevents creating multiple GoTrue/Realtime WebSocket connections. |
| `src/lib/audio/SoundFactory.ts` | The `AudioContext` is a Singleton via the `getAudioContext()` function. Only one AudioContext is created per app lifetime to avoid resource exhaustion and browser restrictions. |

---

### 6. 📝 Command Pattern

**What it is:** A behavioral pattern that turns a request into a stand-alone object containing all information about the request. Commands can be queued, logged, and transmitted over a network.

**Where it's implemented:**

| File | Description |
|------|-------------|
| `src/components/room/Whiteboard.tsx` | Each drawing action is a command object containing `{ action, from, to, color, brushSize }`. Commands are created locally, executed on the local canvas, and then broadcast to remote users via Supabase Realtime. Remote users receive the command and replay it on their canvas. The `clear` command is also a command object. |
| `src/types/index.ts` | The `DrawCommand` interface defines the command structure with `id`, `type`, `data`, `userId`, and `timestamp`. |

---

## Cloud Computing Patterns

### 7. ☁️ Serverless Architecture

**What it is:** An execution model where the cloud provider completely manages the infrastructure. Resources are dynamically provisioned on-demand, scale automatically, and developers strictly focus on application code.

**Where it's implemented:**

| File | Description |
|------|-------------|
| Vercel Deployment | The frontend is deployed statically and via Edge functions to Vercel's global CDN, requiring no traditional "server" management. It strictly scales automatically around traffic demands. |
| Supabase (PostgreSQL / Auth) | Fully managed backend-as-a-service (BaaS) replacing a traditional backend server API. |

**Key characteristics:**
- **Zero infrastructure management** — developers don't manage VMs, RAM, or OS patching.
- **Pay-as-you-go** consumption.
- **High Availability** naturally built into edge nodes globally.

---

### 8. 📡 Event-Driven Architecture

**What it is:** A cloud design paradigm where program flow is determined by events — messages published to a channel and consumed by subscribers (Pub/Sub). Producers and consumers are completely decoupled.

**Where it's implemented:**

| File | Description |
|------|-------------|
| `src/lib/realtime/RealtimeManager.ts` | Uses Supabase Realtime **Broadcast** (Pub/Sub) to send and receive events across all connected clients in a room. Publishers call `broadcastEvent()`. Subscribers register via `subscribeToEvents()`. |
| `src/app/room/[code]/page.tsx` | **Event Producer + Consumer:** Publishes `participant-joined`, `participant-left`, `whiteboard-opened`, `background-changed`. Consumes events to show notifications and update UI state. |
| `src/components/room/Whiteboard.tsx` | **Event Producer + Consumer:** Publishes `whiteboard-draw` commands and subscribes to remote draw events to replay them on the local canvas. |

**Event types flowing through the system:**
- `whiteboard-opened` / `whiteboard-closed`
- `mic-toggled`
- `participant-joined` / `participant-left`
- `background-changed`
- `whiteboard-draw`
- `atmosphere-changed`

**Key characteristic:** The producer (e.g., user drawing on whiteboard) has zero knowledge of who is consuming its events. The Supabase Realtime channel acts as the event bus — any number of clients can subscribe and react independently.

---

## Pattern Summary Table

| # | Pattern | Type | Key Files |
|---|---------|------|-----------|
| 1 | Observer | Software — Behavioral | `RealtimeManager.ts`, `room/page.tsx`, `Whiteboard.tsx` |
| 2 | Factory | Software — Creational | `SoundFactory.ts`, `AudioPanel.tsx` |
| 3 | Strategy | Software — Behavioral | `ThemeStrategy.ts`, `ThemeSwitcher.tsx`, `ThemeProvider.tsx` |
| 4 | Repository | Software — Structural | `RoomRepository.ts`, `UserRepository.ts`, `NoteRepository.ts`, `WhiteboardRepository.ts` |
| 5 | Singleton | Software — Creational | `supabase/client.ts`, `SoundFactory.ts` |
| 6 | Command | Software — Behavioral | `Whiteboard.tsx`, `types/index.ts` |
| 7 | Serverless Architecture | Cloud | Vercel, Supabase Platform |
| 8 | Event-Driven Architecture | Cloud | `RealtimeManager.ts`, Supabase Realtime Broadcast |
