import type { Rule } from '../types';
import { api } from '../api';

interface Props {
  rules: Rule[];
  onEdit: (rule: Rule) => void;
  onChanged: () => void | Promise<void>;
  onError: (message: string) => void;
}

function trigger(rule: Rule) {
  if (rule.match_type === 'any') return <span>Any comment</span>;
  return (
    <span>
      {rule.match_type === 'exact' ? 'Comment is exactly ' : 'Comment contains '}
      {rule.keywords.map((k) => (
        <span key={k} className="chip">
          {k}
        </span>
      ))}
    </span>
  );
}

export default function RuleList({ rules, onEdit, onChanged, onError }: Props) {
  async function run(action: () => Promise<unknown>) {
    try {
      await action();
      await onChanged();
    } catch (err) {
      onError((err as Error).message);
    }
  }

  if (rules.length === 0) {
    return (
      <p className="empty">
        No automations yet. Create your first one, for example keyword <strong>link</strong> → DM your link.
      </p>
    );
  }

  return (
    <ul className="rules">
      {rules.map((rule) => (
        <li key={rule.id} className={`rule ${rule.enabled ? '' : 'rule-paused'}`} aria-label={rule.name}>
          <div className="rule-media">
            {rule.media_thumbnail_url ? (
              <img src={rule.media_thumbnail_url} alt="" />
            ) : (
              <span>{rule.media_id ? 'Reel' : 'All'}</span>
            )}
          </div>
          <div className="rule-body">
            <div className="rule-head">
              <div>
                <div className="rule-title">
                  {rule.name}
                  {!rule.enabled && <span className="tag">Paused</span>}
                </div>
                <div className="muted small">
                  {rule.media_id ? (rule.media_label ?? 'One reel') : 'All reels & posts'} · {rule.sent_count} {rule.sent_count === 1 ? 'DM' : 'DMs'} sent
                </div>
              </div>
            </div>
            <div className="small rule-trigger">{trigger(rule)}</div>
            <div className="bubble bubble-sm">{rule.dm_message}</div>
            {rule.public_reply && <div className="muted small">Public reply: {rule.public_reply}</div>}
            <div className="rule-actions">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => run(() => api.setRuleEnabled(rule.id, !rule.enabled))}
              >
                {rule.enabled ? 'Pause' : 'Resume'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => onEdit(rule)}>
                Edit
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => {
                  if (window.confirm(`Delete "${rule.name}"?`)) run(() => api.deleteRule(rule.id));
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
