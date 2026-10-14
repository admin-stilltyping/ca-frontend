// Meta App Review requires a public privacy policy URL and a data-deletion status page.
// Edit the wording and contact address before submitting your app.

export function PrivacyPage() {
  return (
    <main className="doc">
      <h1>Privacy policy</h1>
      <p>
        Reel DM Automation lets Instagram creators send an automatic direct message to people who comment on their
        posts.
      </p>
      <h2>What we store</h2>
      <ul>
        <li>Your Instagram username, account ID, profile picture URL and an encrypted access token.</li>
        <li>The automations you create (keywords and messages).</li>
        <li>
          For each automated DM: the commenter's username, the comment text and whether the DM was sent. This
          activity log is deleted after 90 days.
        </li>
      </ul>
      <h2>What we don't do</h2>
      <ul>
        <li>We never see or store your Instagram password.</li>
        <li>We don't sell or share your data, and we only message people who commented on your posts.</li>
      </ul>
      <h2>Deleting your data</h2>
      <p>
        Use <strong>Delete my account &amp; data</strong> in the dashboard, or remove the app under Instagram →
        Settings → Website permissions → Apps and websites. Either removes everything we store about you.
      </p>
      <p>
        <a href="/">Back to the app</a>
      </p>
    </main>
  );
}

export function DeletionPage() {
  const code = new URLSearchParams(window.location.search).get('code');
  return (
    <main className="doc">
      <h1>Your data has been deleted</h1>
      <p>We removed your account, automations and activity history from Reel DM Automation.</p>
      {code && (
        <p>
          Confirmation code: <code>{code}</code>
        </p>
      )}
      <p>
        <a href="/">Back to the app</a>
      </p>
    </main>
  );
}
