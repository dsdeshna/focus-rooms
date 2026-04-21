# architecture & design patterns

This document serves as a technical companion to the Focus Rooms project, detailing the software and cloud patterns implemented within the system. These patterns ensure the application is modular, maintainable, and scalable.

---

## software design patterns

### 1. Singleton Pattern
**Location**: [`src/lib/supabase/client.ts`](./src/lib/supabase/client.ts)  
The Singleton pattern is used to manage the Supabase client. By ensuring only one instance of the client exists, we prevent redundant connections and maintain a consistent authentication state across the browser session.

### 2. Factory Pattern
**Location**: [`src/lib/audio/SoundFactory.ts`](./src/lib/audio/SoundFactory.ts)  
The `SoundFactory` class encapsulates the creation logic for various audio generators (White Noise, Ambient Players, etc.). This allows the UI to request a "sound generator" without needing to know the specific class or complex initialization logic behind each type.

### 3. Strategy Pattern
**Location**: [`src/lib/themes/ThemeStrategy.ts`](./src/lib/themes/ThemeStrategy.ts)  
Theme management is handled via the Strategy pattern. Each color palette (Lavender, Sage, etc.) is a strategy that provides specific CSS tokens. The application can swap these strategies at runtime, instantly changing the visual experience without modifying core components.

### 4. Observer Pattern
**Location**: [`src/lib/realtime/RealtimeManager.ts`](./src/lib/realtime/RealtimeManager.ts)  
The `RealtimeManager` acts as the *Subject*, while various components (Whiteboard, Participant List, Chat) act as *Observers*. When a real-time event occurs, the manager notifies all registered observers, decoupling the event source from the UI response.

### 5. Repository Pattern
**Location**: [`src/lib/repositories/`](./src/lib/repositories/)  
Data access is abstracted through Repositories (e.g., `UserRepository`, `RoomRepository`). This separates the business logic from the underlying Supabase queries, making the code easier to test and allowing for potential database migrations with minimal impact.

### 6. Command Pattern
**Location**: [`src/components/room/Whiteboard.tsx`](./src/components/room/Whiteboard.tsx)  
Whiteboard interactions are encapsulated as commands. When a user draws a line, that action is serialized into a command object and broadcasted. This allows remote clients to "execute" the same drawing command, maintaining local state synchronization across the room.

---

## cloud computing patterns

### 7. Serverless Architecture
Focus Rooms is built on a modern serverless stack. The frontend and API routes are hosted on **Vercel** as serverless functions, while the backend utilizes **Supabase** as a Backend-as-a-Service (BaaS). This eliminates the need for manual server provisioning and ensures the app scales automatically based on demand.

### 8. Event-Driven Architecture
The synchronization of whiteboards, presence, and room events follows an Event-Driven pattern. Using **Supabase Realtime (Pub/Sub)**, the application reacts to events as they happen. This architecture is loosely coupled; producers broadcast events to a channel, and consumers react to them asynchronously, ensuring a responsive user experience.
