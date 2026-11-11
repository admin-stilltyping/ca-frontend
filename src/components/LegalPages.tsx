// Meta App Review requires a public privacy policy URL, terms of service URL and a
// data-deletion status page.
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

export function TermsPage() {
  return (
    <main className="doc">
      <h1>Terms of service</h1>
      <p>
        These terms cover your use of Reel DM Automation, which sends an automatic direct message to people who
        comment on your Instagram posts.
      </p>
      <h2>Using the service</h2>
      <ul>
        <li>You need an Instagram Business or Creator account that you own, or are allowed to manage.</li>
        <li>You choose the keywords and the message, and you are responsible for what is sent in your name.</li>
        <li>
          Your use has to follow Instagram's own terms and platform policies. Don't send spam, scams or anything
          misleading.
        </li>
      </ul>
      <h2>What we do</h2>
      <p>
        We send your message once per matching comment, and keep a short activity log so you can see what happened.
        Instagram may rate-limit or refuse a message; when it does, the activity log records the failure.
      </p>
      <h2>Availability</h2>
      <p>
        The service is provided as is, without warranty. We may change or suspend it, and we may end access that
        breaks these terms or Instagram's policies. You can stop at any time with{' '}
        <strong>Delete my account &amp; data</strong> in the dashboard.
      </p>
      <h2>Fees</h2>
      <p>The service is free while it is in testing. If we add paid plans, we will say so before charging you.</p>
      <h2>Contact</h2>
      <p>
        Questions about these terms: <a href="mailto:support@stilltyping.in">support@stilltyping.in</a>
      </p>
      <p>
        <a href="/">Back to the app</a>
      </p>
    </main>
  );
}
