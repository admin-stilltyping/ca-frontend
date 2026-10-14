import { daysUntil, mediaKind, mediaLabel, renderMessage, timeAgo } from './format';
import { reel } from './test-utils';

it('renders {username}', () => {
  expect(renderMessage('Hi {username}, and {username}')).toBe('Hi @your_follower, and @your_follower');
  expect(renderMessage('Hi {username}', 'sam')).toBe('Hi @sam');
});

it('labels media', () => {
  expect(mediaKind(reel('a'))).toBe('Reel');
  expect(mediaKind({ ...reel('a'), media_product_type: 'FEED', media_type: 'IMAGE' })).toBe('Post');
  expect(mediaLabel(reel('a', 'First line\nsecond line'))).toMatch(/^Reel · .+ · First line$/);
});

it('formats relative times', () => {
  const now = Date.parse('2026-10-13T12:00:00Z');
  expect(timeAgo('2026-10-13T11:59:30Z', now)).toBe('just now');
  expect(timeAgo('2026-10-13T11:15:00Z', now)).toBe('45m ago');
  expect(timeAgo('2026-10-13T07:00:00Z', now)).toBe('5h ago');
  expect(timeAgo('2026-10-10T12:00:00Z', now)).toBe('3d ago');
  expect(daysUntil('2026-10-20T13:00:00Z', now)).toBe(7);
});
