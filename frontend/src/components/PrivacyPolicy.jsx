import React from 'react';
import { Mail, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy({ onBack }) {
    return (
        <div className="min-h-screen bg-background text-textMain flex flex-col">
            {/* Header */}
            <header className="bg-surface border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm font-medium text-textMuted hover:text-textMain transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-primary p-1.5 rounded-lg">
                        <Mail className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">TempyMail</span>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
                <p className="text-textMuted text-sm mb-10">Last updated: March 12, 2026</p>

                <Section title="1. Introduction">
                    <p>TempyMail ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and the choices you have in relation to that information when you use our Service at <a href="https://tempymail.site" className="text-primary hover:underline">tempymail.site</a>.</p>
                    <p className="mt-3">By using TempyMail, you agree to the collection and use of information in accordance with this policy.</p>
                </Section>

                <Section title="2. Information We Collect">
                    <p><strong>Free Plan Users (Anonymous)</strong></p>
                    <p className="mt-2">Free users do not need to create an account. We do not collect any personally identifiable information from free users. We store only:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Temporary email addresses generated during your session (automatically deleted after 1 hour).</li>
                        <li>Email messages received to those addresses (automatically deleted after 1 hour).</li>
                        <li>Browser session data stored locally on your device (email history in localStorage).</li>
                    </ul>

                    <p className="mt-4"><strong>Premium Plan Users</strong></p>
                    <p className="mt-2">When you sign up for a Premium account, we collect:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>Account Information:</strong> Your email address and a hashed password.</li>
                        <li><strong>Billing Information:</strong> Payment is processed entirely by Paystack. We do not store your card details. We receive only a Paystack customer ID and subscription status confirmation.</li>
                        <li><strong>Usage Data:</strong> Custom aliases created, webhook URLs configured, and forwarding addresses set.</li>
                        <li><strong>Email Data:</strong> Messages received by your inboxes, retained for up to 7 days then automatically deleted.</li>
                    </ul>
                </Section>

                <Section title="3. How We Use Your Information">
                    <p>We use the information we collect to:</p>
                    <ul className="list-disc pl-5 mt-3 space-y-2">
                        <li>Provide, maintain, and improve the TempyMail Service.</li>
                        <li>Process your subscription payments and manage your Premium account.</li>
                        <li>Respond to support requests sent to <a href="mailto:support@tempymail.site" className="text-primary hover:underline">support@tempymail.site</a>.</li>
                        <li>Detect and prevent abuse, fraud, or violations of our Terms of Service.</li>
                        <li>Send transactional emails (e.g., password reset, payment confirmations). We do not send marketing emails without your consent.</li>
                    </ul>
                </Section>

                <Section title="4. Cookies and Analytics">
                    <p>We use minimal cookies and local browser storage to maintain your session and remember your preferences (such as theme selection). We may use anonymized, aggregated analytics to understand how users interact with the Service (e.g., page visits, feature usage). We do not use advertising cookies or track you across third-party websites.</p>
                </Section>

                <Section title="5. Third-Party Services">
                    <p>We use the following third-party services, each governed by their own privacy policies:</p>
                    <ul className="list-disc pl-5 mt-3 space-y-3">
                        <li>
                            <strong>Paystack</strong> — Payment processing for Premium subscriptions.
                            <a href="https://paystack.com/privacy" className="text-primary hover:underline ml-1" target="_blank" rel="noopener noreferrer">Paystack Privacy Policy →</a>
                        </li>
                        <li>
                            <strong>Google reCAPTCHA v3</strong> — Bot protection on account creation. Google may collect hardware and software information for abuse prevention.
                            <a href="https://policies.google.com/privacy" className="text-primary hover:underline ml-1" target="_blank" rel="noopener noreferrer">Google Privacy Policy →</a>
                        </li>
                        <li>
                            <strong>Hetzner Cloud</strong> — Our servers are hosted on Hetzner infrastructure in the EU, providing GDPR-compliant data storage.
                        </li>
                    </ul>
                </Section>

                <Section title="6. Data Retention">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Free email sessions &amp; messages:</strong> Automatically deleted after 1 hour.</li>
                        <li><strong>Premium inbox messages:</strong> Automatically deleted after 7 days.</li>
                        <li><strong>Premium account data:</strong> Retained for as long as your account is active. Upon account deletion, all personal data is erased within 30 days.</li>
                        <li><strong>Billing records:</strong> Paystack retains payment records as required by financial regulations.</li>
                    </ul>
                </Section>

                <Section title="7. Data Security">
                    <p>We implement industry-standard security measures including HTTPS encryption for all data in transit, password hashing (bcrypt), and secure server configurations. While we strive to protect your data, no method of transmission over the internet is 100% secure.</p>
                </Section>

                <Section title="8. Your Rights">
                    <p>Depending on your jurisdiction, you may have the right to:</p>
                    <ul className="list-disc pl-5 mt-3 space-y-2">
                        <li>Access the personal data we hold about you.</li>
                        <li>Request correction or deletion of your personal data.</li>
                        <li>Object to or restrict processing of your personal data.</li>
                        <li>Export your data in a portable format.</li>
                    </ul>
                    <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:support@tempymail.site" className="text-primary hover:underline">support@tempymail.site</a>. Premium users can also delete their account directly from the Profile page.</p>
                </Section>

                <Section title="9. Children's Privacy">
                    <p>The Service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately so we can delete it.</p>
                </Section>

                <Section title="10. Changes to This Policy">
                    <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the "Last updated" date at the top of this page. Your continued use of the Service after changes constitutes acceptance of the updated policy.</p>
                </Section>

                <Section title="11. Contact Us">
                    <p>If you have any questions or concerns about this Privacy Policy, please contact us at:</p>
                    <p className="mt-3">
                        <strong>TempyMail Support</strong><br />
                        Email: <a href="mailto:support@tempymail.site" className="text-primary hover:underline">support@tempymail.site</a><br />
                        Website: <a href="https://tempymail.site" className="text-primary hover:underline">tempymail.site</a>
                    </p>
                </Section>
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-6 px-6 text-center text-textMuted text-sm">
                © 2026 TempyMail. All rights reserved. &nbsp;·&nbsp;
                <a href="/terms" className="hover:text-primary transition-colors">Terms</a> &nbsp;·&nbsp;
                <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a> &nbsp;·&nbsp;
                <a href="/refund" className="hover:text-primary transition-colors">Refund Policy</a>
            </footer>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-border">{title}</h2>
            <div className="text-textMuted text-sm leading-relaxed space-y-2">
                {children}
            </div>
        </div>
    );
}
