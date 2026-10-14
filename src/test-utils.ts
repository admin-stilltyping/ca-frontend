import { vi } from 'vitest';
import type { Activity, Me, Media, Rule } from './types';

type Handler = unknown | ((body: unknown) => unknown);
export interface Call {
  method: string;
  path: string;
  body: unknown;
}

/** Fakes fetch(). Keys look like "GET /api/rules". A handler may return a value, or a Response. */
export function mockApi(routes: Record<string, Handler>) {
  const calls: Call[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method ?? 'GET').toUpperCase();
    const path = String(input);
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path, body });
    const key = `${method} ${path}`;
    if (!(key in routes)) return new Response(JSON.stringify({ detail: `Unmocked ${key}` }), { status: 500 });
    const handler = routes[key];
    const result = typeof handler === 'function' ? (handler as (b: unknown) => unknown)(body) : handler;
    if (result instanceof Response) return result;
    if (result === undefined) return new Response(null, { status: 204 });
    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls, fetchMock, routes };
}

export const jsonError = (status: number, detail: string) =>
  new Response(JSON.stringify({ detail }), { status, headers: { 'Content-Type': 'application/json' } });

export const me = (overrides: Partial<Me> = {}): Me => ({
  ig_user_id: '1784',
  username: 'creator',
  name: 'Creator',
  profile_picture_url: null,
  token_expires_at: new Date(Date.now() + 50 * 86_400_000).toISOString(),
  webhook_subscribed: true,
  webhook_error: null,
  stats: { total_sent: 42, sent_7d: 7, failed_7d: 1 },
  ...overrides,
});

export const reel = (id: string, caption = `Caption ${id}`): Media => ({
  id,
  caption,
  media_type: 'VIDEO',
  media_product_type: 'REELS',
  thumbnail_url: `https://cdn.test/${id}.jpg`,
  timestamp: '2026-10-01T10:00:00+0000',
});

export const rule = (overrides: Partial<Rule> = {}): Rule => ({
  id: 'r1',
  name: 'Free guide',
  media_id: null,
  media_label: null,
  media_thumbnail_url: null,
  match_type: 'contains',
  keywords: ['link', 'guide'],
  dm_message: 'Hi {username}! https://example.com/guide',
  public_reply: 'Check your DMs',
  enabled: true,
  sent_count: 12,
  created_at: '2026-10-01T10:00:00Z',
  ...overrides,
});

export const activity = (overrides: Partial<Activity> = {}): Activity => ({
  id: 1,
  rule_id: 'r1',
  rule_name: 'Free guide',
  comment_id: 'c1',
  media_id: 'reel1',
  username: 'fan_01',
  comment_text: 'LINK pls',
  status: 'sent',
  error: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

/** Standard logged-in backend. Override any route per test. */
export function loggedInApi(overrides: Record<string, Handler> = {}) {
  return mockApi({
    'GET /api/me': me(),
    'GET /api/rules': [rule()],
    'GET /api/media': [reel('reel1'), reel('reel2')],
    'GET /api/activity': [activity()],
    ...overrides,
  });
}
