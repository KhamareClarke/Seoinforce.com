import { logGhlApiCall } from './admin-logs';

const GHL_BASE = 'https://services.leadconnectorhq.com';

export type GhlClientConfig = {
  apiKey: string;
  locationId: string;
  /** API version header required by LeadConnector */
  apiVersion: string;
};

export function getGhlClientConfig(): GhlClientConfig | null {
  const apiKey = (
    process.env.GHL_API_KEY ??
    process.env.GHL_PRIVATE_INTEGRATION_TOKEN ??
    process.env.GOHIGHLEVEL_API_KEY ??
    process.env.GOHIGHLEVEL_SMS_API_KEY ??
    ''
  ).trim();
  const locationId = (
    process.env.GHL_LOCATION_ID ??
    process.env.GOHIGHLEVEL_LOCATION_ID ??
    process.env.GOHIGHLEVEL_SMS_LOCATION_ID ??
    ''
  ).trim();
  if (!apiKey || !locationId) return null;
  return {
    apiKey,
    locationId,
    apiVersion: (process.env.GHL_API_VERSION ?? '2021-07-28').trim(),
  };
}

export function isGhlConfigured(): boolean {
  return getGhlClientConfig() !== null;
}

export class GhlApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string
  ) {
    super(message);
    this.name = 'GhlApiError';
  }
}

let lastRequestAt = 0;
const MIN_SPACING_MS = 120;

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export type GhlRequestInit = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

/**
 * Generic GHL API request with light rate limiting + retries on 429/5xx.
 */
export async function makeGhlRequest<T = unknown>(
  path: string,
  init: GhlRequestInit = {}
): Promise<T> {
  const cfg = getGhlClientConfig();
  if (!cfg) {
    throw new GhlApiError('GHL is not configured (GHL_API_KEY, GHL_LOCATION_ID)', 500);
  }

  const url = path.startsWith('http')
    ? path
    : `${GHL_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.apiKey}`,
    Accept: 'application/json',
    Version: cfg.apiVersion,
    ...init.headers,
  };
  if (init.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const now = Date.now();
  const wait = lastRequestAt + MIN_SPACING_MS - now;
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();

  let attempt = 0;
  const maxAttempts = 3;
  let lastErr: unknown;

  const method = (init.method ?? 'GET').toUpperCase();
  const logPath = path.startsWith('http') ? new URL(path).pathname : path;
  const started = Date.now();

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      const res = await fetch(url, { ...init, headers });
      const text = await res.text();
      if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
        await sleep(400 * attempt);
        lastErr = new GhlApiError(`GHL temporarily unavailable (${res.status})`, res.status, text);
        continue;
      }
      if (!res.ok) {
        const err = new GhlApiError(`GHL API error ${res.status}`, res.status, text);
        void logGhlApiCall({
          method,
          path: logPath,
          statusCode: res.status,
          durationMs: Date.now() - started,
          error: err.message,
        });
        throw err;
      }
      void logGhlApiCall({
        method,
        path: logPath,
        statusCode: res.status,
        durationMs: Date.now() - started,
      });
      if (!text) return {} as T;
      try {
        return JSON.parse(text) as T;
      } catch {
        return text as unknown as T;
      }
    } catch (e) {
      lastErr = e;
      if (e instanceof GhlApiError && e.status !== 429 && !(e.status >= 500)) {
        throw e;
      }
      if (attempt >= maxAttempts) break;
      await sleep(400 * attempt);
    }
  }

  void logGhlApiCall({
    method,
    path: logPath,
    durationMs: Date.now() - started,
    error: lastErr instanceof Error ? lastErr.message : String(lastErr),
  });
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export function getGhlLocationId(): string | null {
  return getGhlClientConfig()?.locationId ?? null;
}
