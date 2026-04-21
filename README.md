# focus rooms

A collaborative digital sanctuary designed for deep work, creative flow, and quiet connection. focus rooms blends a dreamy, minimalist aesthetic with robust real-time features to create a space where you can focus together, apart.

Built for the **Cloud Computing** and **Software Design Patterns** courses, this application explores the intersection of serverless architecture and elegant code design.

---

## the experience

focus rooms is defined by its atmospheric approach to productivity. every detail—from the soft pastel palettes to the gentle curves of the interface—is curated to reduce digital noise.

### 🌿 atmospheric audio
- **Noise Generators**: Pure white, pink, and brown noise synthesized via the Web Audio API.
- **Ambient Soundscapes**: Evocative loops of rain, forest murmurs, and café bustle.
- **Frequency Tuner**: A tunable oscillator (20Hz–2000Hz) for custom sonic grounding.

### 🎨 creative collaboration
- **Shared Whiteboard**: A real-time canvas for brainstorming, sketching, and visual thinking.
- **Snapshots**: Export your whiteboard as a PNG to preserve the flow of ideas.
- **Sticky Notes**: Personal, translucent notes that stay visible only to you—perfect for private to-do lists.

### 🐚 seamless connection
- **Voice & Screen**: High-fidelity peer-to-peer communication powered by WebRTC.
- **Presence**: Knowing who is with you in the room, with subtle indicators for activity.
- **Personalization**: Choose from 8 curated themes—from *Lavender Dream* to *Midnight Muse*—to match your mood.

---

## the architecture

The technical foundation of focus rooms is built on modern "serverless" principles, ensuring scalability and real-time responsiveness without the overhead of traditional server management.

| layer | choice | rationale |
| :--- | :--- | :--- |
| **frontend** | Next.js & TypeScript | Type-safe, edge-ready, and performant. |
| **styling** | Tailwind & Custom CSS | Soft glassmorphism and fluid animations. |
| **database** | Supabase (Postgres) | Reliable relational storage with powerful Auth. |
| **real-time** | Supabase Realtime | low-latency Pub/Sub for whiteboard and presence. |
| **media** | WebRTC | P2P mesh for voice and screen sharing. |

---

## blueprints & patterns

This project serves as a practical implementation of **6 Software Design Patterns** and **2 Cloud Architectures**. Each pattern is a deliberate choice made to ensure the codebase remains maintainable, extensible, and robust.

> [!NOTE]
> For a detailed technical breakdown of how and where these patterns are implemented, please refer to the **[PATTERNS.md](./PATTERNS.md)** guide.

1. **Observer** — Real-time event distribution.
2. **Factory** — Dynamic audio generator creation.
3. **Strategy** — Swappable theme logic.
4. **Repository** — Decoupled database access.
5. **Singleton** — Centralized Supabase client management.
6. **Command** — Encapsulated whiteboard actions.
7. **Serverless Architecture** — Our core cloud deployment strategy.
8. **Event-Driven Architecture** — Real-time broadcast and presence sync.

---

## getting started

Whether you are here to explore the code or to host your own focus session, the setup process is designed to be straightforward.

1. **Prerequisites**: Ensure you have Node.js 18+ and a Supabase account ready.
2. **Setup**: Follow the step-by-step guide in **[SETUP.md](./SETUP.md)** to configure your environment.
3. **Run**: `npm install` followed by `npm run dev` brings the room to life locally.

---

## aesthetics & typography

The visual identity of focus rooms relies on two primary serif fonts to convey a sense of calm and clarity:
- **Playfair Display**: Used for headings to evoke a refined, editorial feel.
- **Lora**: Used for body text for its readability and soft, contemporary character.

The color palette is built on **Strategy Pattern** tokens, allowing for seamless transitions between light and dark modes while maintaining the core "Pinterest-pastel" aesthetic.
