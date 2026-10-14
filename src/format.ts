import type { Media } from './types';

export const PREVIEW_USERNAME = 'your_follower';

export function mediaKind(m: Media): string {
  if (m.media_product_type === 'REELS') return 'Reel';
  if (m.media_type === 'VIDEO') return 'Video';
  if (m.media_type === 'CAROUSEL_ALBUM') return 'Carousel';
  return 'Post';
}

export function mediaLabel(m: Media): string {
  const caption = (m.caption ?? '').split('\n')[0].trim().slice(0, 60);
  const date = new Date(m.timestamp).toLocaleDateString();
  return `${mediaKind(m)} · ${date}${caption ? ` · ${caption}` : ''}`;
}

export function mediaThumb(m: Media): string | undefined {
  return m.thumbnail_url ?? (m.media_type === 'IMAGE' ? m.media_url : undefined);
}

export function renderMessage(template: string, username = PREVIEW_USERNAME): string {
  return template.replaceAll('{username}', `@${username}`);
}

export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.round((now - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function daysUntil(iso: string, now = Date.now()): number {
  return Math.floor((new Date(iso).getTime() - now) / 86_400_000);
}
