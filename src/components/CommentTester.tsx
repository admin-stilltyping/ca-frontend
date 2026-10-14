import { useState, type FormEvent } from 'react';
import { api } from '../api';
import { mediaLabel } from '../format';
import type { Media, TestResult } from '../types';

export default function CommentTester({ media }: { media: Media[] }) {
  const [text, setText] = useState('');
  const [mediaId, setMediaId] = useState('');
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    try {
      setResult(await api.testComment(text, mediaId || null));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={submit} aria-label="Test a comment">
      <h2>Test a comment</h2>
      <p className="muted small">Check what would happen, without sending anything.</p>
      <div className="tester-row">
        <select aria-label="Reel to test" value={mediaId} onChange={(e) => setMediaId(e.target.value)}>
          <option value="">Another reel (not listed)</option>
          {media.map((m) => (
            <option key={m.id} value={m.id}>
              {mediaLabel(m)}
            </option>
          ))}
        </select>
        <input
          aria-label="Comment text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setResult(null);
          }}
          placeholder='Type a comment, e.g. "Link pls 🙏"'
        />
        <button type="submit" className="btn btn-ghost" disabled={!text.trim()}>
          Test
        </button>
      </div>
      {error && <p className="error small">{error}</p>}
      {result && (
        <div className={`tester-result ${result.matched ? 'ok' : 'no'}`} role="status">
          {result.matched && result.rule ? (
            <>
              <div>
                ✅ Matches <strong>{result.rule.name}</strong>. They would get:
              </div>
              <div className="bubble bubble-sm">{result.dm}</div>
              {result.public_reply && <div className="muted small">Public reply: {result.public_reply}</div>}
            </>
          ) : (
            <div>No automation matches this comment. Nothing would be sent.</div>
          )}
        </div>
      )}
    </form>
  );
}
