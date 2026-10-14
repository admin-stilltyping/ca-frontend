import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { daysUntil } from '../format';
import type { Activity, Me, Media, Rule } from '../types';
import ActivityLog from './ActivityLog';
import CommentTester from './CommentTester';
import RuleForm from './RuleForm';
import RuleList from './RuleList';

interface Props {
  me: Me;
  onMeChange: (me: Me) => void;
  onLoggedOut: () => void;
}

export default function Dashboard({ me, onMeChange, onLoggedOut }: Props) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resubscribing, setResubscribing] = useState(false);

  const loadRules = useCallback(() => api.rules().then(setRules), []);
  const refreshActivity = useCallback(async () => {
    const [items, fresh] = await Promise.all([api.activity(), api.me(), loadRules()]);
    setActivity(items);
    onMeChange(fresh);
  }, [loadRules, onMeChange]);

  useEffect(() => {
    loadRules().catch((e) => setError(e.message));
    api.activity().then(setActivity).catch((e) => setError(e.message));
    api
      .media()
      .then(setMedia)
      .catch((e) => setMediaError(e.message))
      .finally(() => setMediaLoading(false));
  }, [loadRules]);

  async function logout() {
    await api.logout();
    onLoggedOut();
  }

  async function deleteAccount() {
    const ok = window.confirm(
      'Delete your account and all automations? Auto-DMs stop immediately. This cannot be undone.',
    );
    if (!ok) return;
    await api.deleteAccount();
    onLoggedOut();
  }

  async function resubscribe() {
    setResubscribing(true);
    try {
      onMeChange(await api.resubscribe());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setResubscribing(false);
    }
  }

  const daysLeft = daysUntil(me.token_expires_at);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/favicon.svg" alt="" width={28} height={28} />
          <span>Reel DM Automation</span>
        </div>
        <div className="account">
          {me.profile_picture_url ? (
            <img className="avatar" src={me.profile_picture_url} alt="" />
          ) : (
            <span className="avatar avatar-fallback">{me.username.slice(0, 1).toUpperCase()}</span>
          )}
          <span className="username">@{me.username}</span>
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      {!me.webhook_subscribed && (
        <div className="banner banner-warning" role="alert">
          <span>
            Comment events aren't enabled for your account yet, so no DMs will be sent.
            {me.webhook_error && <span className="muted"> ({me.webhook_error})</span>}
          </span>
          <button className="btn btn-sm btn-primary" onClick={resubscribe} disabled={resubscribing}>
            {resubscribing ? 'Enabling…' : 'Enable now'}
          </button>
        </div>
      )}
      {daysLeft <= 7 && (
        <div className="banner banner-warning" role="alert">
          <span>
            {daysLeft < 0
              ? 'Your Instagram connection has expired. Log in again to keep sending DMs.'
              : `Your Instagram connection expires in ${daysLeft} day(s). Log in again to renew it.`}
          </span>
          <a className="btn btn-sm btn-primary" href="/auth/instagram">
            Reconnect
          </a>
        </div>
      )}
      {error && (
        <div className="banner banner-error" role="alert">
          <span>{error}</span>
          <button className="banner-close" aria-label="Dismiss" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      <section className="stats" aria-label="Stats">
        <Stat label="DMs sent (all time)" value={me.stats.total_sent} />
        <Stat label="Sent last 7 days" value={me.stats.sent_7d} />
        <Stat label="Failed last 7 days" value={me.stats.failed_7d} tone={me.stats.failed_7d ? 'bad' : undefined} />
        <Stat label="Active automations" value={rules.filter((r) => r.enabled).length} />
      </section>

      <main className="layout">
        <section className="panel">
          <RuleForm
            key={editing?.id ?? 'new'}
            media={media}
            mediaLoading={mediaLoading}
            mediaError={mediaError}
            editing={editing}
            onSaved={async () => {
              setEditing(null);
              await loadRules();
            }}
            onCancel={() => setEditing(null)}
          />
        </section>

        <div className="stack">
          <section className="panel">
            <h2>Your automations</h2>
            <RuleList
              rules={rules}
              onEdit={(rule) => {
                setEditing(rule);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onChanged={loadRules}
              onError={setError}
            />
          </section>

          <section className="panel">
            <CommentTester media={media} />
          </section>

          <section className="panel">
            <ActivityLog items={activity} onRefresh={refreshActivity} />
          </section>
        </div>
      </main>

      <footer className="footer">
        <a href="/privacy">Privacy policy</a>
        <button className="link-danger" onClick={deleteAccount}>
          Delete my account &amp; data
        </button>
      </footer>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'bad' }) {
  return (
    <div className="stat">
      <div className={`stat-value ${tone === 'bad' ? 'text-bad' : ''}`}>{value.toLocaleString()}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
