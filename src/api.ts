import type { Activity, Me, Media, Rule, RuleInput, TestResult } from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: options.method ?? 'GET',
    credentials: 'same-origin',
    headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : `Request failed (${res.status})`;
    throw new ApiError(detail, res.status);
  }
  return data as T;
}

export const api = {
  me: () => request<Me>('/api/me'),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  resubscribe: () => request<Me>('/api/account/resubscribe', { method: 'POST' }),
  deleteAccount: () => request<void>('/api/account', { method: 'DELETE' }),
  media: () => request<Media[]>('/api/media'),
  rules: () => request<Rule[]>('/api/rules'),
  createRule: (input: RuleInput) => request<Rule>('/api/rules', { method: 'POST', body: input }),
  updateRule: (id: string, input: RuleInput) => request<Rule>(`/api/rules/${id}`, { method: 'PUT', body: input }),
  setRuleEnabled: (id: string, enabled: boolean) =>
    request<Rule>(`/api/rules/${id}`, { method: 'PATCH', body: { enabled } }),
  deleteRule: (id: string) => request<void>(`/api/rules/${id}`, { method: 'DELETE' }),
  testComment: (text: string, mediaId: string | null) =>
    request<TestResult>('/api/rules/test', { method: 'POST', body: { text, media_id: mediaId } }),
  activity: () => request<Activity[]>('/api/activity'),
};
