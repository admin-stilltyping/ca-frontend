import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { activity, jsonError, loggedInApi, me, mockApi, rule } from './test-utils';

describe('logged out', () => {
  it('shows the Instagram login button', async () => {
    mockApi({ 'GET /api/me': jsonError(401, 'Not logged in') });
    render(<App />);
    const button = await screen.findByRole('link', { name: 'Log in with Instagram' });
    expect(button).toHaveAttribute('href', '/auth/instagram');
  });

  it('shows login errors passed back from the OAuth callback', async () => {
    window.history.replaceState(null, '', '/?error=Instagram%20login%20failed');
    mockApi({ 'GET /api/me': jsonError(401, 'Not logged in') });
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Instagram login failed');
    expect(window.location.search).toBe('');
  });

  it('explains when the server is unreachable', async () => {
    mockApi({ 'GET /api/me': jsonError(500, 'boom') });
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server: boom');
  });

  it('renders the privacy and deletion pages', () => {
    window.history.replaceState(null, '', '/deletion?code=abc123');
    const { unmount } = render(<App />);
    expect(screen.getByRole('heading', { name: 'Your data has been deleted' })).toBeInTheDocument();
    expect(screen.getByText('abc123')).toBeInTheDocument();
    unmount();
    window.history.replaceState(null, '', '/privacy');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Privacy policy' })).toBeInTheDocument();
  });
});

describe('dashboard', () => {
  it('shows account, stats, automations and activity', async () => {
    loggedInApi();
    render(<App />);
    expect(await screen.findByText('@creator')).toBeInTheDocument();
    const stats = screen.getByLabelText('Stats');
    expect(within(stats).getByText('42')).toBeInTheDocument();
    expect(within(stats).getByText('7')).toBeInTheDocument();

    const ruleItem = await screen.findByRole('listitem', { name: 'Free guide' });
    expect(within(ruleItem).getByText('link')).toBeInTheDocument();
    expect(within(ruleItem).getByText('12 DMs sent', { exact: false })).toBeInTheDocument();

    expect(await screen.findByText('@fan_01')).toBeInTheDocument();
    expect(await screen.findAllByRole('radio')).toHaveLength(3); // "All" + 2 reels
  });

  it('logs out', async () => {
    const api = loggedInApi({ 'POST /auth/logout': undefined });
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Log out' }));
    expect(await screen.findByRole('link', { name: 'Log in with Instagram' })).toBeInTheDocument();
    expect(api.calls.some((c) => c.method === 'POST' && c.path === '/auth/logout')).toBe(true);
  });

  it('warns when comment events are not enabled and lets the user retry', async () => {
    loggedInApi({
      'GET /api/me': me({ webhook_subscribed: false, webhook_error: 'Missing permission' }),
      'POST /api/account/resubscribe': me(),
    });
    render(<App />);
    expect(await screen.findByText(/Comment events aren't enabled/)).toBeInTheDocument();
    expect(screen.getByText('(Missing permission)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Enable now' }));
    await waitFor(() => expect(screen.queryByText(/Comment events aren't enabled/)).not.toBeInTheDocument());
  });

  it('warns when the Instagram token is about to expire', async () => {
    loggedInApi({ 'GET /api/me': me({ token_expires_at: new Date(Date.now() + 3 * 86_400_000 + 3600_000).toISOString() }) });
    render(<App />);
    expect(await screen.findByText(/expires in 3 day/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reconnect' })).toHaveAttribute('href', '/auth/instagram');
  });

  it('shows a media loading error without breaking the page', async () => {
    loggedInApi({ 'GET /api/media': jsonError(502, 'Could not load your reels: Token expired') });
    render(<App />);
    expect(await screen.findByText('Could not load your reels: Token expired')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create automation' })).toBeEnabled();
  });

  it('deletes the account after confirmation', async () => {
    const api = loggedInApi({ 'DELETE /api/account': undefined });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<App />);
    const button = await screen.findByRole('button', { name: 'Delete my account & data' });
    await userEvent.click(button);
    expect(api.calls.some((c) => c.method === 'DELETE')).toBe(false);
    await userEvent.click(button);
    expect(await screen.findByRole('link', { name: 'Log in with Instagram' })).toBeInTheDocument();
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it('refreshes activity and stats', async () => {
    const api = loggedInApi();
    render(<App />);
    await screen.findByText('@fan_01');
    api.routes['GET /api/activity'] = [activity({ id: 2, username: 'new_fan', status: 'failed', error: 'Outside window' })];
    api.routes['GET /api/me'] = me({ stats: { total_sent: 43, sent_7d: 8, failed_7d: 2 } });
    api.routes['GET /api/rules'] = [rule({ sent_count: 13 })];
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(await screen.findByText('@new_fan')).toBeInTheDocument();
    expect(screen.getByText('Outside window')).toBeInTheDocument();
    expect(screen.getByText('43')).toBeInTheDocument();
  });
});
