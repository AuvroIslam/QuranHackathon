export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white px-6 py-16 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-white">Privacy Policy</h1>
      <p className="text-white/40 text-sm mb-10">Last updated: April 2026</p>

      <div className="space-y-8 text-white/75 leading-relaxed text-sm">
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">1. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-white">Account data:</strong> Name and email address
              collected via Google Sign-In or email/password registration.
            </li>
            <li>
              <strong className="text-white">Usage data:</strong> XP points, streak counts,
              completed tasks, and Quran listening progress stored in Firebase Firestore.
            </li>
            <li>
              <strong className="text-white">Community content:</strong> Posts and replies you
              create in the Community section.
            </li>
            <li>
              <strong className="text-white">Quran.com data (optional):</strong> If you connect
              your Quran.com account, we sync bookmarks and reading sessions via the Quran
              Foundation User APIs on your behalf.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide and personalise the App experience</li>
            <li>To track your Quran engagement progress and streaks</li>
            <li>To sync bookmarks and reading sessions with Quran Foundation APIs</li>
            <li>To display community posts and replies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">3. Data Sharing</h2>
          <p>
            We do not sell or share your personal data with third parties except as required
            to operate the App:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>
              <strong className="text-white">Firebase (Google):</strong> Authentication and
              database storage.
            </li>
            <li>
              <strong className="text-white">Quran Foundation:</strong> Verse content, audio,
              and (if connected) user bookmark and reading session data.
            </li>
            <li>
              <strong className="text-white">AI providers (Groq, Mistral, DeepSeek):</strong>{" "}
              Your chat messages and mood inputs are sent to AI providers to generate responses.
              No personally identifiable information is included.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">4. Quran Foundation OAuth2</h2>
          <p>
            When you connect your Quran.com account, we use OAuth2 with PKCE. Your access
            token is stored only in your browser&apos;s sessionStorage and is never sent to our
            servers except to proxy API calls to Quran Foundation on your behalf. We never
            store your Quran.com password.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">5. Data Retention</h2>
          <p>
            Your account data is retained as long as your account exists. You may request
            deletion by contacting us. Community posts you delete are removed immediately.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">6. Security</h2>
          <p>
            We use Firebase security rules to protect your data and HTTPS for all data in
            transit. API secrets are stored server-side only and never exposed to the browser.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">7. Children&apos;s Privacy</h2>
          <p>
            DeenQuest AI is not directed at children under 13. We do not knowingly collect
            data from children under 13.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">8. Contact</h2>
          <p>
            For privacy questions or data deletion requests:{" "}
            <a href="mailto:oitijya2002@gmail.com" className="text-purple-400 underline">
              oitijya2002@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
