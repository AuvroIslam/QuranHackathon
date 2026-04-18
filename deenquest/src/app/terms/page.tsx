export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white px-6 py-16 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-white">Terms of Service</h1>
      <p className="text-white/40 text-sm mb-10">Last updated: April 2026</p>

      <div className="space-y-8 text-white/75 leading-relaxed text-sm">
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using DeenQuest AI (&ldquo;the App&rdquo;), you agree to be bound by
            these Terms of Service. If you do not agree, please do not use the App.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">2. Description of Service</h2>
          <p>
            DeenQuest AI is a gamified Quran companion application that helps users build and
            maintain a daily connection with the Quran through AI-powered guidance, recitation
            tools, community features, and habit tracking.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">3. Use of Quran Foundation APIs</h2>
          <p>
            The App integrates Quran Foundation Content and User APIs to fetch verified Quranic
            text, translations, audio recitations, and to sync user data such as bookmarks and
            reading sessions. All Quranic content is sourced directly from these APIs and is not
            modified or misrepresented.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">4. User Accounts</h2>
          <p>
            Users may sign in via Google or email/password through Firebase Authentication.
            You are responsible for maintaining the confidentiality of your account credentials.
            We reserve the right to suspend accounts that violate these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">5. User-Generated Content</h2>
          <p>
            Users may post reflections and questions in the Community section. You retain
            ownership of your content. By posting, you grant DeenQuest AI a non-exclusive
            licence to display that content within the App. Content that is disrespectful,
            harmful, or violates Islamic etiquette may be removed.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">6. Prohibited Use</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Misrepresenting or altering Quranic verses or translations</li>
            <li>Using the App for any unlawful purpose</li>
            <li>Attempting to reverse-engineer or exploit the App&apos;s APIs</li>
            <li>Posting content that is hateful, abusive, or harmful</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">7. Disclaimer</h2>
          <p>
            The AI-generated explanations in this App are provided for general guidance only and
            do not constitute official Islamic legal rulings (fatwa). Always refer to qualified
            scholars for religious rulings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">8. Changes to Terms</h2>
          <p>
            We may update these Terms at any time. Continued use of the App after changes
            constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">9. Contact</h2>
          <p>
            For questions about these Terms, contact us at:{" "}
            <a href="mailto:oitijya2002@gmail.com" className="text-purple-400 underline">
              oitijya2002@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
