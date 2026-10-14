export default function LoginPage() {
  return (
    <main className="login">
      <div className="login-card">
        <img src="/favicon.svg" alt="" width={56} height={56} />
        <h1>Reel DM Automation</h1>
        <p className="lead">Turn "comment LINK" into an instant DM, automatically.</p>
        <ol className="steps">
          <li>
            <span className="step-num">1</span>
            <span>
              Say in your reel: <em>"Comment LINK and I'll send it to you"</em>
            </span>
          </li>
          <li>
            <span className="step-num">2</span>
            <span>
              A follower comments <strong>link</strong>
            </span>
          </li>
          <li>
            <span className="step-num">3</span>
            <span>They get your link in their DMs within seconds</span>
          </li>
        </ol>
        <a className="btn btn-ig btn-lg" href="/auth/instagram">
          Log in with Instagram
        </a>
        <p className="hint">
          Works with Instagram Business and Creator accounts. We never see your password.
        </p>
        <p className="hint">
          <a href="/privacy">Privacy policy</a>
        </p>
      </div>
    </main>
  );
}
