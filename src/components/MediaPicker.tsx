import { mediaKind, mediaLabel, mediaThumb } from '../format';
import type { Media } from '../types';

interface Props {
  media: Media[];
  loading: boolean;
  error: string | null;
  value: string | null;
  onChange: (media: Media | null) => void;
}

export default function MediaPicker({ media, loading, error, value, onChange }: Props) {
  return (
    <div className="media-picker">
      <div className="media-grid" role="radiogroup" aria-label="Which reel?">
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          className={`media-tile media-all ${value === null ? 'selected' : ''}`}
          onClick={() => onChange(null)}
        >
          <span>All reels &amp; posts</span>
        </button>
        {media.map((m) => {
          const thumb = mediaThumb(m);
          return (
            <button
              type="button"
              role="radio"
              key={m.id}
              aria-checked={value === m.id}
              aria-label={mediaLabel(m)}
              title={mediaLabel(m)}
              className={`media-tile ${value === m.id ? 'selected' : ''}`}
              onClick={() => onChange(m)}
            >
              {thumb ? <img src={thumb} alt="" loading="lazy" /> : <span>{mediaKind(m)}</span>}
              {m.media_product_type === 'REELS' && <span className="media-badge">Reel</span>}
            </button>
          );
        })}
      </div>
      {loading && <p className="muted small">Loading your reels…</p>}
      {error && <p className="error small">{error}</p>}
      {!loading && !error && media.length === 0 && <p className="muted small">No posts found on this account yet.</p>}
    </div>
  );
}
