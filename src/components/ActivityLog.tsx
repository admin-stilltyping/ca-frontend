import { useEffect, useState } from 'react';
import { timeAgo } from '../format';
import type { Activity } from '../types';

const AUTO_REFRESH_MS = 30_000;

interface Props {
  items: Activity[];
  onRefresh: () => Promise<void>;
}

export default function ActivityLog({ items, onRefresh }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch {
      // keep showing the last list; the next refresh will try again
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') onRefresh().catch(() => {});
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [onRefresh]);

  return (
    <div>
      <div className="row-between">
        <h2>Recent activity</h2>
        <button className="btn btn-ghost btn-sm" onClick={refresh} disabled={refreshing}>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="empty">No DMs yet. When someone comments one of your keywords, it shows up here.</p>
      ) : (
        <ul className="activity">
          {items.map((a) => (
            <li key={a.id} className="act">
              <span className={`pill pill-${a.status}`}>{a.status === 'sent' ? 'Sent' : 'Failed'}</span>
              <div className="act-body">
                <div>
                  <strong>@{a.username ?? 'unknown'}</strong> commented “{a.comment_text}”
                  {a.rule_name && <span className="muted"> → {a.rule_name}</span>}
                </div>
                {a.error && <div className="error small">{a.error}</div>}
              </div>
              <time className="muted small" dateTime={a.created_at} title={new Date(a.created_at).toLocaleString()}>
                {timeAgo(a.created_at)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
