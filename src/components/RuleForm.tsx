import { useState, type FormEvent } from 'react';
import { api } from '../api';
import { mediaLabel, mediaThumb, PREVIEW_USERNAME, renderMessage } from '../format';
import type { MatchType, Media, Rule, RuleInput } from '../types';
import MediaPicker from './MediaPicker';

const DM_LIMIT = 1000;

interface Props {
  media: Media[];
  mediaLoading: boolean;
  mediaError: string | null;
  editing: Rule | null;
  onSaved: (rule: Rule) => void | Promise<void>;
  onCancel: () => void;
}

function initialForm(rule: Rule | null): RuleInput {
  return {
    name: rule?.name ?? '',
    media_id: rule?.media_id ?? null,
    media_label: rule?.media_label ?? null,
    media_thumbnail_url: rule?.media_thumbnail_url ?? null,
    match_type: rule?.match_type ?? 'contains',
    keywords: rule?.keywords.join(', ') ?? '',
    dm_message: rule?.dm_message ?? '',
    public_reply: rule?.public_reply ?? '',
  };
}

export default function RuleForm({ media, mediaLoading, mediaError, editing, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<RuleInput>(() => initialForm(editing));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof RuleInput>(key: K, value: RuleInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  function pickMedia(m: Media | null) {
    setForm((f) => ({
      ...f,
      media_id: m?.id ?? null,
      media_label: m ? mediaLabel(m) : null,
      media_thumbnail_url: m ? (mediaThumb(m) ?? null) : null,
    }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const keywords = form.keywords.split(',').map((k) => k.trim()).filter(Boolean);
    if (form.match_type !== 'any' && keywords.length === 0) return setError('Add at least one keyword.');
    if (!form.dm_message.trim()) return setError('Write the DM you want to send.');

    setSaving(true);
    try {
      const saved = editing ? await api.updateRule(editing.id, form) : await api.createRule(form);
      setForm(initialForm(null));
      await onSaved(saved);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const keywordsHidden = form.match_type === 'any';

  return (
    <form onSubmit={submit} aria-label={editing ? 'Edit automation' : 'New automation'}>
      <h2>{editing ? 'Edit automation' : 'New automation'}</h2>

      <fieldset className="field">
        <legend>1. Which reel?</legend>
        <MediaPicker
          media={media}
          loading={mediaLoading}
          error={mediaError}
          value={form.media_id}
          onChange={pickMedia}
        />
        {form.media_id && form.media_label && <p className="muted small">Selected: {form.media_label}</p>}
      </fieldset>

      <div className="field">
        <label htmlFor="match_type">2. When someone comments…</label>
        <select
          id="match_type"
          value={form.match_type}
          onChange={(e) => set('match_type', e.target.value as MatchType)}
        >
          <option value="contains">a comment containing any of these words</option>
          <option value="exact">exactly one of these words (nothing else)</option>
          <option value="any">anything at all</option>
        </select>
      </div>

      {!keywordsHidden && (
        <div className="field">
          <label htmlFor="keywords">Keywords</label>
          <input
            id="keywords"
            value={form.keywords}
            onChange={(e) => set('keywords', e.target.value)}
            placeholder="link, guide, send"
            autoComplete="off"
          />
          <p className="muted small">Separate with commas. Capital letters, punctuation and emoji are ignored.</p>
        </div>
      )}

      <div className="field">
        <label htmlFor="dm_message">3. Send them this DM</label>
        <textarea
          id="dm_message"
          rows={4}
          maxLength={DM_LIMIT}
          value={form.dm_message}
          onChange={(e) => set('dm_message', e.target.value)}
          placeholder="Hey {username}! Here's the link you asked for 👉 https://example.com"
        />
        <div className="row-between small muted">
          <span>
            <code>{'{username}'}</code> becomes their @handle.
          </span>
          <span>
            {form.dm_message.length}/{DM_LIMIT}
          </span>
        </div>
      </div>

      {form.dm_message.trim() && (
        <div className="dm-preview" aria-label="DM preview">
          <div className="dm-preview-head">Preview, as @{PREVIEW_USERNAME} sees it</div>
          <div className="bubble">{renderMessage(form.dm_message)}</div>
        </div>
      )}

      <div className="field">
        <label htmlFor="public_reply">
          Also reply publicly under the comment <span className="muted">(optional)</span>
        </label>
        <input
          id="public_reply"
          maxLength={300}
          value={form.public_reply}
          onChange={(e) => set('public_reply', e.target.value)}
          placeholder="Sent! Check your DMs 📩"
        />
      </div>

      <div className="field">
        <label htmlFor="name">
          Name <span className="muted">(optional, only you see this)</span>
        </label>
        <input
          id="name"
          maxLength={80}
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Free guide reel"
        />
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create automation'}
        </button>
        {editing && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
