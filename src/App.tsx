import { useEffect, useState } from 'react';
import { api, ApiError } from './api';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import { DeletionPage, PrivacyPage } from './components/LegalPages';
import type { Me } from './types';

type Flash = { kind: 'error' | 'warning'; text: string } | null;

function readFlash(): Flash {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');
  const warning = params.get('warning');
  if (error || warning) window.history.replaceState(null, '', window.location.pathname);
  if (error) return { kind: 'error', text: error };
  if (warning) return { kind: 'warning', text: warning };
  return null;
}

export default function App() {
  const path = window.location.pathname;
  if (path === '/privacy') return <PrivacyPage />;
  if (path === '/deletion') return <DeletionPage />;
  return <Home />;
}

function Home() {
  const [flash, setFlash] = useState<Flash>(readFlash);
  const [me, setMe] = useState<Me | null>(null);
  const [state, setState] = useState<'loading' | 'in' | 'out'>('loading');

  useEffect(() => {
    api
      .me()
      .then((m) => {
        setMe(m);
        setState('in');
      })
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) {
          setFlash({ kind: 'error', text: `Could not reach the server: ${err.message}` });
        }
        setState('out');
      });
  }, []);

  const banner = flash && (
    <div className={`banner banner-${flash.kind}`} role="alert">
      <span>{flash.text}</span>
      <button className="banner-close" aria-label="Dismiss" onClick={() => setFlash(null)}>
        ×
      </button>
    </div>
  );

  if (state === 'loading') {
    return <div className="center muted" aria-busy="true">Loading…</div>;
  }
  if (state === 'out' || !me) {
    return (
      <>
        {banner}
        <LoginPage />
      </>
    );
  }
  return (
    <>
      {banner}
      <Dashboard
        me={me}
        onMeChange={setMe}
        onLoggedOut={() => {
          setMe(null);
          setState('out');
        }}
      />
    </>
  );
}
