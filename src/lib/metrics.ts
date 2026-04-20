// ============================================================
// === MONITORING PATTERN — Prometheus Metrics Registry ===
// Singleton registry for application-level metrics.
// Prometheus scrapes the /api/metrics endpoint which reads
// from this registry.
// ============================================================

import client from 'prom-client';

// === SINGLETON: One registry per process ===
const register = new client.Registry();

// Set default labels for all metrics
register.setDefaultLabels({
  app: 'focus-rooms',
  environment: process.env.NODE_ENV || 'development',
});

// Collect default Node.js runtime metrics (memory, CPU, event loop, etc.)
client.collectDefaultMetrics({ register });

// ── Custom Application Metrics ──

/** Total HTTP requests processed */
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'path', 'status_code'] as const,
  registers: [register],
});

/** HTTP request duration in seconds */
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status_code'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/** Number of currently active rooms */
export const activeRoomsGauge = new client.Gauge({
  name: 'active_rooms_total',
  help: 'Number of currently active rooms',
  registers: [register],
});

/** Number of active WebSocket/Realtime connections */
export const activeConnectionsGauge = new client.Gauge({
  name: 'active_connections_total',
  help: 'Number of active realtime connections',
  registers: [register],
});

/** Total room-related events (join, leave, etc.) */
export const roomEventsTotal = new client.Counter({
  name: 'room_events_total',
  help: 'Total room lifecycle events',
  labelNames: ['event_type'] as const,
  registers: [register],
});

export { register };
