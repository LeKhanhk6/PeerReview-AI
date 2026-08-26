import { v4 as uuidv4 } from 'uuid';

export interface TelemetryEvent {
  event: 'loader_timeout' | 'chunk_load_error' | 'ai_error' | 'ui_error';
  metadata?: Record<string, any>;
  userId?: string;
  timestamp: number;
  sessionId: string;
}

export interface ClientErrorPayload {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  timestamp: number;
  sessionId: string;
  componentStack?: string;
}

// Generate sessionId once per page load
export const sessionId = uuidv4();

const TELEMETRY_ENABLED = import.meta.env.VITE_ENABLE_TELEMETRY === 'true';

let eventCount = 0;
let lastResetTime = Date.now();
let failCount = 0;
const MAX_FAILS = 3;

function isRateLimited(): boolean {
  const now = Date.now();
  // Reset window every 1 minute
  if (now - lastResetTime > 60000) {
    eventCount = 0;
    lastResetTime = now;
  }
  
  if (eventCount >= 10) {
    return true;
  }
  
  eventCount++;
  return false;
}

export async function sendTelemetry(payload: Omit<TelemetryEvent, 'sessionId' | 'timestamp'>) {
  if (!TELEMETRY_ENABLED) {
    console.warn('[Telemetry disabled]', payload);
    return;
  }

  if (navigator.onLine === false) return;
  if (failCount >= MAX_FAILS) return;
  if (isRateLimited()) return;

  const fullPayload: TelemetryEvent = {
    ...payload,
    timestamp: Date.now(),
    sessionId,
  };

  try {
    const response = await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPayload),
    });

    if (response.status >= 500) {
      failCount++;
    } else {
      failCount = 0; // reset on success
    }
  } catch (_error) {
    failCount++;
  }
}

export async function sendClientError(payload: Omit<ClientErrorPayload, 'sessionId' | 'timestamp' | 'userAgent' | 'url'>) {
  if (!TELEMETRY_ENABLED) {
    console.error('[Client Error disabled]', payload);
    return;
  }

  if (navigator.onLine === false) return;
  if (failCount >= MAX_FAILS) return;
  if (isRateLimited()) return;

  const fullPayload: ClientErrorPayload = {
    ...payload,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
    sessionId,
  };

  try {
    const response = await fetch('/api/client-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPayload),
    });

    if (response.status >= 500) {
      failCount++;
    } else {
      failCount = 0;
    }
  } catch (_error) {
    failCount++;
  }
}
