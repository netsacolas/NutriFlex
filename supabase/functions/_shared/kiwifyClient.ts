import type { Logger } from './logger.ts';
import { serializeError } from './logger.ts';

const BASE_URL = Deno.env.get('KIWIFY_API_BASE_URL')?.trim() || 'https://public-api.kiwify.com';
const RATE_LIMIT_PER_MINUTE = 100;
const MAX_RETRY_5XX = 3;
const MAX_RETRY_429 = 5;
const TOKEN_SAFETY_MARGIN_SECONDS = 300; // 5 minutos

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface TokenCache {
  token: string;
  expiresAt: number;
}

interface RequestOptions {
  method?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
  forceRefresh?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: Record<string, unknown>;
  hasMore: boolean;
  nextPage?: number | null;
  nextCursor?: string | null;
  raw: unknown;
}

export interface FetchSubscriptionsParams {
  page?: number;
  perPage?: number;
  updatedFrom?: string;
  updatedTo?: string;
  email?: string;
  externalId?: string;
  subscriptionId?: string;
  cursor?: string;
}

export interface FetchChargesParams {
  page?: number;
  perPage?: number;
  paidFrom?: string;
  paidTo?: string;
  email?: string;
  subscriptionId?: string;
  cursor?: string;
}

export type JsonRecord = Record<string, unknown>;

class RateLimiter {
  private lastTimestamp = 0;
  private readonly minIntervalMs: number;

  constructor(perMinute: number) {
    this.minIntervalMs = Math.ceil(60000 / Math.max(perMinute, 1));
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastTimestamp;
    if (elapsed < this.minIntervalMs) {
      await delay(this.minIntervalMs - elapsed);
    }
    this.lastTimestamp = Date.now();
  }
}

const kvPromise = typeof Deno.openKv === 'function' ? Deno.openKv() : null;
const KV_TOKEN_KEY = ['kiwify', 'oauth', 'token'];
const KV_EXPIRES_KEY = ['kiwify', 'oauth', 'expires_at'];

let memoryCache: TokenCache | null = null;

const preloadFromEnv = () => {
  const token = Deno.env.get('KIWIFY_OAUTH_TOKEN');
  const expiresAt = Deno.env.get('KIWIFY_OAUTH_EXPIRES_AT');
  if (token && expiresAt) {
    const parsed = Number(expiresAt);
    if (!Number.isNaN(parsed) && parsed > Date.now()) {
      memoryCache = { token, expiresAt: parsed };
    }
  }
};

preloadFromEnv();

const extractItems = <T>(payload: unknown): { items: T[]; meta: Record<string, unknown> } => {
  if (Array.isArray(payload)) {
    return { items: payload as T[], meta: {} };
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const metaCandidate = (record.meta || record.pagination || {}) as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return { items: record.data as T[], meta: metaCandidate };
    }
    if (Array.isArray(record.items)) {
      return { items: record.items as T[], meta: metaCandidate };
    }
  }

  return { items: [], meta: {} };
};

const parseBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') return ['true', '1', 'yes'].includes(value.toLowerCase());
  return false;
};

export class KiwifyApiClient {
  private readonly rateLimiter: RateLimiter;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly accountId: string;
  private lastTokenSource: 'memory' | 'kv' | 'api' | null = null;

  constructor(private readonly logger: Logger) {
    const clientId = Deno.env.get('KIWIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('KIWIFY_CLIENT_SECRET');
    const accountId = Deno.env.get('KIWIFY_ACCOUNT_ID');

    if (!clientId || !clientSecret || !accountId) {
      throw new Error('Missing Kiwify credentials (KIWIFY_CLIENT_ID, KIWIFY_CLIENT_SECRET, KIWIFY_ACCOUNT_ID).');
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accountId = accountId;
    this.rateLimiter = new RateLimiter(RATE_LIMIT_PER_MINUTE);
  }

  private async getKv(): Promise<Deno.Kv | null> {
    try {
      return kvPromise ? await kvPromise : null;
    } catch (error) {
      this.logger.warn('kv_unavailable', serializeError(error));
      return null;
    }
  }

  private async loadTokenFromKv(): Promise<TokenCache | null> {
    const kv = await this.getKv();
    if (!kv) return null;

    try {
      const [tokenEntry, expiresEntry] = await Promise.all([
        kv.get<string>(KV_TOKEN_KEY),
        kv.get<number>(KV_EXPIRES_KEY),
      ]);

      if (tokenEntry.value && expiresEntry.value && expiresEntry.value > Date.now()) {
        return {
          token: tokenEntry.value,
          expiresAt: expiresEntry.value,
        };
      }
    } catch (error) {
      this.logger.warn('kv_read_failed', serializeError(error));
    }

    return null;
  }

  private async storeToken(token: string, expiresAt: number): Promise<void> {
    const kv = await this.getKv();
    if (!kv) return;

    try {
      await Promise.all([
        kv.set(KV_TOKEN_KEY, token),
        kv.set(KV_EXPIRES_KEY, expiresAt),
      ]);
    } catch (error) {
      this.logger.warn('kv_write_failed', serializeError(error));
    }
  }

  private async clearToken(): Promise<void> {
    memoryCache = null;
    this.lastTokenSource = null;
    const kv = await this.getKv();
    if (!kv) return;

    try {
      await Promise.all([
        kv.delete(KV_TOKEN_KEY),
        kv.delete(KV_EXPIRES_KEY),
      ]);
    } catch (error) {
      this.logger.warn('kv_delete_failed', serializeError(error));
    }
  }

  private async getAccessToken(forceRefresh = false): Promise<string> {
    const now = Date.now();

    if (!forceRefresh && memoryCache && memoryCache.expiresAt > now + 5000) {
      this.lastTokenSource = 'memory';
      return memoryCache.token;
    }

    if (!forceRefresh) {
      const persisted = await this.loadTokenFromKv();
      if (persisted && persisted.expiresAt > now + 5000) {
        memoryCache = persisted;
        this.lastTokenSource = 'kv';
        return persisted.token;
      }
    }

    this.logger.info('oauth_token_refresh', { source: forceRefresh ? 'forced' : 'cache_miss' });

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const response = await fetch(`${BASE_URL}/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error('oauth_token_failed', {
        status: response.status,
        response: errorText.slice(0, 512),
      });
      throw new Error(`Failed to obtain Kiwify OAuth token (${response.status}).`);
    }

    const data = await response.json() as { access_token?: string; expires_in?: number };
    if (!data.access_token || !data.expires_in) {
      this.logger.error('oauth_token_invalid_payload', { payload: data });
      throw new Error('Invalid token payload from Kiwify.');
    }

    const expiresAt = Date.now() + Math.max(0, data.expires_in - TOKEN_SAFETY_MARGIN_SECONDS) * 1000;
    memoryCache = {
      token: data.access_token,
      expiresAt,
    };
    this.lastTokenSource = 'api';

    await this.storeToken(data.access_token, expiresAt);

    return data.access_token;
  }

  private buildUrl(path: string, query?: RequestOptions['query'], cursor?: string | null): string {
    const url = path.startsWith('http') ? new URL(path) : new URL(`${BASE_URL}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
    }
    if (cursor) {
      url.searchParams.set('cursor', cursor);
    }
    return url.toString();
  }

  private async request(path: string, options: RequestOptions = {}, attempt = 1, cursor?: string | null): Promise<Response> {
    await this.rateLimiter.wait();

    const token = await this.getAccessToken(options.forceRefresh ?? false);
    const url = this.buildUrl(path, options.query, cursor);

    const headers = new Headers({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-kiwify-account-id': this.accountId,
      ...options.headers,
    });

    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 401 || response.status === 403) {
      if (attempt <= 1) {
        this.logger.warn('oauth_token_invalidated', { status: response.status });
        await this.clearToken();
        return this.request(path, { ...options, forceRefresh: true }, attempt + 1, cursor);
      }
    }

    if (response.status === 429) {
      if (attempt > MAX_RETRY_429) {
        this.logger.error('too_many_requests', { attempt, status: response.status });
        return response;
      }
      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : null;
      const backoffMs = Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds! * 1000
        : Math.pow(2, attempt) * 1000;
      this.logger.warn('rate_limited', { attempt, backoffMs });
      await delay(backoffMs);
      return this.request(path, options, attempt + 1, cursor);
    }

    if (response.status >= 500 && response.status < 600) {
      if (attempt > MAX_RETRY_5XX) {
        return response;
      }
      const backoffMs = Math.pow(2, attempt) * 1000;
      this.logger.warn('server_error_retry', { attempt, status: response.status, backoffMs });
      await delay(backoffMs);
      return this.request(path, options, attempt + 1, cursor);
    }

    return response;
  }

  private async requestJson<T = JsonRecord>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.request(path, options);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Kiwify API responded with ${response.status}: ${text.slice(0, 512)}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  }

  async fetchSubscriptions(params: FetchSubscriptionsParams = {}): Promise<PaginatedResponse<JsonRecord>> {
    const { subscriptionId, cursor, ...rest } = params;

    if (subscriptionId) {
      const payload = await this.requestJson<JsonRecord>(`/v1/sales/${subscriptionId}`);
      const { items, meta } = extractItems<JsonRecord>(payload);
      return {
        items: items.length > 0 ? items : [payload],
        meta,
        hasMore: false,
        nextPage: null,
        nextCursor: null,
        raw: payload,
      };
    }

    // Kiwify API requires start_date and end_date for /v1/sales
    // Default to last 90 days if not provided
    const now = new Date();
    const defaultEndDate = now.toISOString().split('T')[0];
    const defaultStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const payload = await this.requestJson(`/v1/sales`, {
      method: 'GET',
      query: {
        page: rest.page,
        per_page: rest.perPage,
        start_date: rest.updatedFrom || defaultStartDate,
        end_date: rest.updatedTo || defaultEndDate,
      },
      headers: cursor ? { 'x-kiwify-cursor': cursor } : undefined,
    });

    const { items, meta } = extractItems<JsonRecord>(payload);
    const nextPage = typeof meta.next_page === 'number' ? meta.next_page : typeof meta.page === 'number' && typeof meta.total_pages === 'number' && meta.page < meta.total_pages ? meta.page + 1 : null;
    const nextCursor = (meta.next_cursor || meta.cursor || meta.nextPageToken) as string | undefined;
    const hasMore = parseBoolean(meta.has_more) || Boolean(nextPage) || Boolean(nextCursor);

    return {
      items,
      meta,
      hasMore,
      nextPage: typeof nextPage === 'number' ? nextPage : null,
      nextCursor: nextCursor ?? null,
      raw: payload,
    };
  }

  async fetchCharges(params: FetchChargesParams = {}): Promise<PaginatedResponse<JsonRecord>> {
    const { cursor, ...rest } = params;

    // Kiwify API requires start_date and end_date for /v1/payments
    // Default to last 90 days if not provided
    const now = new Date();
    const defaultEndDate = now.toISOString().split('T')[0];
    const defaultStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const payload = await this.requestJson(`/v1/payments`, {
      method: 'GET',
      query: {
        page: rest.page,
        per_page: rest.perPage,
        start_date: rest.paidFrom || defaultStartDate,
        end_date: rest.paidTo || defaultEndDate,
        subscription_id: rest.subscriptionId,
        // Note: email filter may not be supported by /v1/payments endpoint
        // Filtering by email should be done in the application layer if needed
      },
      headers: cursor ? { 'x-kiwify-cursor': cursor } : undefined,
    });

    const { items, meta } = extractItems<JsonRecord>(payload);
    const nextPage = typeof meta.next_page === 'number' ? meta.next_page : null;
    const nextCursor = (meta.next_cursor || meta.cursor || meta.nextPageToken) as string | undefined;
    const hasMore = parseBoolean(meta.has_more) || Boolean(nextPage) || Boolean(nextCursor);

    return {
      items,
      meta,
      hasMore,
      nextPage,
      nextCursor: nextCursor ?? null,
      raw: payload,
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const response = await this.request(`/v1/subscriptions/${subscriptionId}`, { method: 'DELETE' });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to cancel subscription ${subscriptionId}: ${text.slice(0, 512)}`);
    }
  }

  async tokenMetadata(forceRefresh = false): Promise<{ expiresAt: number | null; source: 'memory' | 'kv' | 'api' | null }> {
    await this.getAccessToken(forceRefresh);
    return {
      expiresAt: memoryCache?.expiresAt ?? null,
      source: this.lastTokenSource,
    };
  }
}
