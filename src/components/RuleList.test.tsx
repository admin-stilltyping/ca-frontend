import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jsonError, mockApi, rule } from '../test-utils';
import RuleList from './RuleList';

function setup(rules = [rule(), rule({ id: 'r2', name: 'Any', match_type: 'any', keywords: [], enabled: false })]) {
  const props = { onEdit: vi.fn(), onChanged: vi.fn(), onError: vi.fn() };
  render(<RuleList rules={rules} {...props} />);
  return props;
}

it('shows an empty state', () => {
  setup([]);
  expect(screen.getByText(/No automations yet/)).toBeInTheDocument();
});

it('describes each automation', () => {
  setup();
  const first = screen.getByRole('listitem', { name: 'Free guide' });
  expect(within(first).getByText('All reels & posts', { exact: false })).toBeInTheDocument();
  expect(within(first).getByText('Hi {username}! https://example.com/guide')).toBeInTheDocument();
  expect(within(first).getByText('Public reply: Check your DMs')).toBeInTheDocument();
  const second = screen.getByRole('listitem', { name: 'Any' });
  expect(within(second).getByText('Paused')).toBeInTheDocument();
  expect(within(second).getByText('Any comment')).toBeInTheDocument();
  expect(within(second).getByRole('button', { name: 'Resume' })).toBeInTheDocument();
});

it('pauses, edits and deletes', async () => {
  const api = mockApi({ 'PATCH /api/rules/r1': rule({ enabled: false }), 'DELETE /api/rules/r1': undefined });
  const props = setup();
  const item = screen.getByRole('listitem', { name: 'Free guide' });

  await userEvent.click(within(item).getByRole('button', { name: 'Pause' }));
  await waitFor(() => expect(props.onChanged).toHaveBeenCalledTimes(1));
  expect(api.calls[0]).toEqual({ method: 'PATCH', path: '/api/rules/r1', body: { enabled: false } });

  await userEvent.click(within(item).getByRole('button', { name: 'Edit' }));
  expect(props.onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' }));

  vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
  await userEvent.click(within(item).getByRole('button', { name: 'Delete' }));
  expect(api.calls).toHaveLength(1);
  await userEvent.click(within(item).getByRole('button', { name: 'Delete' }));
  await waitFor(() => expect(props.onChanged).toHaveBeenCalledTimes(2));
  expect(api.calls[1]).toMatchObject({ method: 'DELETE', path: '/api/rules/r1' });
});

it('reports API errors', async () => {
  mockApi({ 'PATCH /api/rules/r1': jsonError(404, 'Automation not found') });
  const props = setup();
  await userEvent.click(within(screen.getByRole('listitem', { name: 'Free guide' })).getByRole('button', { name: 'Pause' }));
  await waitFor(() => expect(props.onError).toHaveBeenCalledWith('Automation not found'));
});
