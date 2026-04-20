# 🧩 Design Patterns & Cloud Patterns — Focus Rooms

This document explains every software design pattern and cloud computing / DevOps pattern implemented in this project, with exact file locations and descriptions.

---

## Software Design Patterns

### 1. 🔔 Observer Pattern

**What it is:** A behavioral pattern where an object (Subject) maintains a list of dependents (Observers) and notifies them automatically of any state changes.

**Where it's implemented:**

| File | Description |
|------|-------------|
| `src/lib/realtime/RealtimeManager.ts` | **Primary implementation.** The `RealtimeManager` is the Subject. It maintains `eventObservers`, `presenceObservers`, and `statusObservers` Maps. Components register via `subscribeToEvents()` and `subscribeToPresence()`. When a broadcast event arrives from Supabase Realtime, the `notifyEventObservers()` method iterates through all registered observers and calls their callbacks. |
| `src/app/room/[code]/page.tsx` | **Observer registration.** The room page registers as an observer for notifications (`'notifications'` observer) and participant list updates (`'participants'` observer). It receives events like `whiteboard-opened`, `participant-joined`, `participant-left`, `background-changed`, etc. |
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
| `src/lib/audio/SoundFactory.ts` | The `AudioContext` is a Singleton via the `getAudioContext()` function. Only one AudioContext is created for the entire app lifetime. |
| `src/lib/metrics.ts` | The Prometheus metrics `Registry` is a Singleton. A single shared registry instance holds all metric collectors, ensuring consistent metric values across the application. |

---

### 6. 📝 Command Pattern

**What it is:** A behavioral pattern that turns a request into a stand-alone object containing all information about the request. Commands can be queued, logged, and transmitted.

**Where it's implemented:**

| File | Description |
|------|-------------|
| `src/components/room/Whiteboard.tsx` | Each drawing action is a command object containing `{ action, from, to, color, brushSize }`. Commands are created locally, executed on the local canvas, and then broadcast to remote users via Supabase Realtime. Remote users receive the command and replay it on their canvas. The `clear` command is also a command object. |
| `src/types/index.ts` | The `DrawCommand` interface defines the command structure with `id`, `type`, `data`, `userId`, and `timestamp`. |

---

## Cloud Computing & DevOps Patterns

### 7. 🐳 Containerization (Docker)

**What it is:** A DevOps practice of packaging an application and all its dependencies into a lightweight, portable container image. Containers ensure the app runs identically in any environment — development, staging, production.

**Where it's implemented:**

| File | Description |
|------|-------------|
| `Dockerfile` | **Multi-stage build** with three stages: (1) `deps` installs production dependencies, (2) `builder` compiles the Next.js app with `next build`, (3) `runner` creates a minimal `node:20-alpine` image with only the standalone output. Runs as a non-root `nextjs` user for security. Includes a `HEALTHCHECK` directive for container orchestration. |
| `.dockerignore` | Excludes `node_modules`, `.next`, `.env*`, `*.tsbuildinfo`, and other unnecessary files from the Docker build context, keeping the image small. |
| `next.config.js` | Sets `output: 'standalone'` so Next.js produces a self-contained server bundle optimized for Docker. |

**Key characteristics:**
- **Multi-stage build** reduces final image size (only production artifacts included)
- **Non-root user** follows container security best practices
- **Health check** baked into the image via `HEALTHCHECK` directive targeting `/api/health`
- **Build args** allow injecting environment variables at build time without baking secrets into layers

---

### 8. ☸️ Container Orchestration (Kubernetes)

**What it is:** A cloud pattern for automating deployment, scaling, and management of containerized applications. Kubernetes (K8s) ensures high availability, self-healing, load balancing, and rolling updates.

**Where it's implemented:**

| File | Description |
|------|-------------|
| `k8s/namespace.yaml` | Creates an isolated `focus-rooms` namespace for all application resources. |
| `k8s/deployment.yaml` | Defines the Deployment with **2 replicas** for high availability. Includes **liveness and readiness probes** hitting `/api/health`, resource requests/limits, and Prometheus scrape annotations. |
| `k8s/service.yaml` | ClusterIP Service that load-balances traffic across pods internally. |
| `k8s/ingress.yaml` | AWS ALB Ingress Controller that routes external internet traffic to the service, with HTTPS redirect and health check configuration. |
| `k8s/hpa.yaml` | HorizontalPodAutoscaler that automatically scales between **2–5 replicas** when CPU utilization exceeds 70%. |
| `k8s/configmap.yaml` | Non-sensitive environment configuration (`NODE_ENV`, `PORT`). |
| `k8s/secret.yaml` | Kubernetes Secret template for Supabase credentials (base64-encoded). |

**Key characteristics:**
- **Self-healing:** If a pod fails its liveness probe, K8s restarts it automatically
- **Auto-scaling:** HPA scales pods horizontally based on real CPU demand
- **Rolling updates:** New deployments are rolled out with zero downtime
- **Service discovery:** Pods are accessed via stable DNS names, not IP addresses
- **Secrets management:** Sensitive values stored in K8s Secrets, not in code

---

### 9. 📊 Monitoring & Observability (Prometheus + Grafana)

**What it is:** A DevOps/cloud pattern for collecting, storing, and visualizing application metrics in real time. Prometheus **scrapes** metrics endpoints, stores time-series data, and Grafana **visualizes** it through dashboards.

**Where it's implemented:**

| File | Description |
|------|-------------|
| `src/lib/metrics.ts` | **Prometheus metrics registry** (Singleton). Defines custom application metrics: `http_requests_total` (Counter), `http_request_duration_seconds` (Histogram), `active_rooms_total` (Gauge), `active_connections_total` (Gauge), `room_events_total` (Counter). Also collects default Node.js runtime metrics (memory, CPU, event loop). |
| `src/app/api/metrics/route.ts` | **Metrics endpoint.** Next.js API Route that serves all collected metrics in Prometheus text exposition format at `/api/metrics`. |
| `src/app/api/health/route.ts` | **Health check endpoint.** Returns application status, uptime, and environment. Used by K8s probes and can be scraped by monitoring. |
| `src/middleware.ts` | **Request instrumentation.** Records response timing via `X-Response-Time` header for every request passing through middleware. |
| `k8s/monitoring/prometheus-configmap.yaml` | Prometheus scrape configuration targeting `focus-rooms-service` at `/api/metrics` every 15 seconds. |
| `k8s/monitoring/prometheus-deployment.yaml` | Prometheus server Deployment + Service in the `monitoring` namespace. Stores 15 days of metric history. |
| `k8s/monitoring/grafana-deployment.yaml` | Grafana Deployment + LoadBalancer Service. Accessible externally for dashboard viewing. |
| `k8s/monitoring/grafana-datasource-configmap.yaml` | Auto-provisions Prometheus as Grafana's default data source on startup. |

**Metrics exposed:**
| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests by method, path, status |
| `http_request_duration_seconds` | Histogram | Request latency distribution |
| `active_rooms_total` | Gauge | Currently active rooms |
| `active_connections_total` | Gauge | Active realtime connections |
| `room_events_total` | Counter | Room lifecycle events (join, leave, etc.) |
| `nodejs_*` | Various | Default Node.js runtime metrics |

---

### 10. 📡 Event-Driven Architecture

**What it is:** A cloud design paradigm where the flow of the program is determined by events — messages published to channels and consumed by subscribers. This is a Pub/Sub (Publish/Subscribe) model.

**Where it's implemented:**

| File | Description |
|------|-------------|
| `src/lib/realtime/RealtimeManager.ts` | Uses Supabase Realtime **Broadcast** (Pub/Sub) to send and receive events. Publishers call `broadcastEvent()` to emit events. Subscribers receive events via the `on('broadcast', ...)` listener. |
| `src/app/room/[code]/page.tsx` | **Event Producer:** Publishes events like `whiteboard-opened`, `participant-joined`, `background-changed`. **Event Consumer:** Subscribes to events and reacts (shows notifications, updates UI). |
| `src/components/room/Whiteboard.tsx` | **Event Producer + Consumer:** Publishes `whiteboard-draw` events and subscribes to remote draw events. |

**Event types in the system:**
- `whiteboard-opened` / `whiteboard-closed`
- `mic-toggled`
- `participant-joined` / `participant-left`
- `background-changed`
- `whiteboard-draw`
- `atmosphere-changed`

**Key characteristic:** Producers and consumers are completely decoupled. A user sharing their screen doesn't need to know which components will react to it. The Supabase Realtime channel acts as the event bus.

---

## Pattern Summary Table

| # | Pattern | Type | Key Files |
|---|---------|------|-----------|
| 1 | Observer | Software — Behavioral | `RealtimeManager.ts`, `room/page.tsx`, `Whiteboard.tsx` |
| 2 | Factory | Software — Creational | `SoundFactory.ts`, `AudioPanel.tsx` |
| 3 | Strategy | Software — Behavioral | `ThemeStrategy.ts`, `ThemeSwitcher.tsx`, `ThemeProvider.tsx` |
| 4 | Repository | Software — Structural | `RoomRepository.ts`, `UserRepository.ts`, `NoteRepository.ts`, `WhiteboardRepository.ts` |
| 5 | Singleton | Software — Creational | `supabase/client.ts`, `SoundFactory.ts`, `metrics.ts` |
| 6 | Command | Software — Behavioral | `Whiteboard.tsx`, `types/index.ts` |
| 7 | Containerization (Docker) | DevOps / Cloud | `Dockerfile`, `.dockerignore`, `next.config.js` |
| 8 | Container Orchestration (K8s) | DevOps / Cloud | `k8s/deployment.yaml`, `k8s/service.yaml`, `k8s/ingress.yaml`, `k8s/hpa.yaml` |
| 9 | Monitoring & Observability | DevOps / Cloud | `metrics.ts`, `api/metrics/route.ts`, `k8s/monitoring/*` |
| 10 | Event-Driven Architecture | Cloud Architecture | `RealtimeManager.ts`, Supabase Realtime Broadcast |
