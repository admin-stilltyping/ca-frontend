import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, reel, rule } from '../test-utils';
import CommentTester from './CommentTester';

it('shows the DM a matching comment would get', async () => {
  const api = mockApi({
    'POST /api/rules/test': { matched: true, rule: rule(), dm: 'Hi @your_follower!', public_reply: 'Check DMs' },
  });
  render(<CommentTester media={[reel('reel1', 'Morning')]} />);
  const user = userEvent.setup();

  expect(screen.getByRole('button', { name: 'Test' })).toBeDisabled();
  await user.selectOptions(screen.getByLabelText('Reel to test'), 'reel1');
  await user.type(screen.getByLabelText('Comment text'), 'link pls');
  await user.click(screen.getByRole('button', { name: 'Test' }));

  const result = await screen.findByRole('status');
  expect(result).toHaveTextContent('Matches Free guide');
  expect(result).toHaveTextContent('Hi @your_follower!');
  expect(result).toHaveTextContent('Public reply: Check DMs');
  expect(api.calls[0].body).toEqual({ text: 'link pls', media_id: 'reel1' });
});

it('says when nothing matches', async () => {
  mockApi({ 'POST /api/rules/test': { matched: false, rule: null, dm: null, public_reply: null } });
  render(<CommentTester media={[]} />);
  await userEvent.type(screen.getByLabelText('Comment text'), 'nice video');
  await userEvent.click(screen.getByRole('button', { name: 'Test' }));
  expect(await screen.findByRole('status')).toHaveTextContent('No automation matches');
});
