/**
 * WhatsSound — Sentry Configuration (Web-first)
 * Monitoreo de errores en tiempo real
 * Usa fetch directo para máxima compatibilidad con Expo Web
 */

const SENTRY_DSN = 'https://874b2ccb9989bbacce4844c41125ae70@o4510811080228864.ingest.de.sentry.io/4510835161170000';

// Parsear DSN
const DSN_REGEX = /^https:\/\/([^@]+)@([^/]+)\/(\d+)$/;
const match = SENTRY_DSN.match(DSN_REGEX);
const SENTRY_KEY = match?.[1] || '';
const SENTRY_HOST = match?.[2] || '';
const SENTRY_PROJECT = match?.[3] || '';

let initialized = false;

export function initSentry() {
  if (initialized) return;
  
  if (!SENTRY_KEY) {
    console.log('[Sentry] No DSN configured, skipping init');
    return;
  }

  // Capturar errores globales
  if (typeof window !== 'undefined') {
    window.onerror = (message, source, lineno, colno, error) => {
      captureError(error || new Error(String(message)), {
        source,
        lineno,
        colno,
      });
    };

    window.onunhandledrejection = (event) => {
      captureError(new Error(`Unhandled Promise: ${event.reason}`));
    };
  }

  initialized = true;
  console.log('[Sentry] ✅ Initialized (lightweight mode)');
}

// Enviar error a Sentry via API
export async function captureError(error: Error, context?: Record<string, any>) {
  if (!SENTRY_KEY) return;

  const payload = {
    event_id: crypto.randomUUID?.() || Date.now().toString(16),
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'error',
    logger: 'whatssound',
    environment: typeof __DEV__ !== 'undefined' && __DEV__ ? 'development' : 'production',
    exception: {
      values: [{
        type: error.name,
        value: error.message,
        stacktrace: error.stack ? {
          frames: parseStack(error.stack),
        } : undefined,
      }],
    },
    contexts: {
      browser: typeof navigator !== 'undefined' ? {
        name: navigator.userAgent,
      } : undefined,
      ...context,
    },
    tags: {
      app: 'whatssound',
    },
  };

  try {
    const url = `https://${SENTRY_HOST}/api/${SENTRY_PROJECT}/store/?sentry_key=${SENTRY_KEY}&sentry_version=7`;
    
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    console.log('[Sentry] Error captured:', error.message);
  } catch (e) {
    console.error('[Sentry] Failed to send:', e);
  }
}

export async function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!SENTRY_KEY) return;

  const payload = {
    event_id: crypto.randomUUID?.() || Date.now().toString(16),
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level,
    message: { formatted: message },
    logger: 'whatssound',
    environment: typeof __DEV__ !== 'undefined' && __DEV__ ? 'development' : 'production',
  };

  try {
    const url = `https://${SENTRY_HOST}/api/${SENTRY_PROJECT}/store/?sentry_key=${SENTRY_KEY}&sentry_version=7`;
    
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    console.log(`[Sentry] Message captured (${level}):`, message);
  } catch (e) {
    console.error('[Sentry] Failed to send:', e);
  }
}

// Parser simple de stack traces
function parseStack(stack: string) {
  return stack.split('\n').slice(1, 10).map(line => {
    const match = line.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/);
    if (match) {
      return {
        function: match[1],
        filename: match[2],
        lineno: parseInt(match[3]),
        colno: parseInt(match[4]),
      };
    }
    return { function: line.trim() };
  });
}
