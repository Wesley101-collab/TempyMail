import React from 'react';
import { Mail, ArrowLeft } from 'lucide-react';

export default function TermsOfService({ onBack }) {
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
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
                <p className="text-textMuted text-sm mb-10">Last updated: March 12, 2026</p>

                <Section title="1. Acceptance of Terms">
                    <p>By accessing or using TempyMail ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service. These Terms apply to all visitors, users, and others who access or use the Service.</p>
                </Section>

                <Section title="2. Description of Service">
                    <p>TempyMail provides disposable temporary email addresses and access to temporary phone numbers for receiving SMS messages online. The Service is offered in two tiers:</p>
                    <ul className="list-disc pl-5 mt-3 space-y-2">
                        <li><strong>Free Plan:</strong> Up to 3 temporary email addresses per day, 1-hour inbox lifetime, AI email summarizer, and basic features.</li>
                        <li><strong>Premium Plan ($4.99/month):</strong> Unlimited email addresses, 7-day inbox lifetime, custom persistent aliases, up to 5 simultaneous inboxes, email forwarding, replies, attachment support, webhook notifications, and full inbox downloads.</li>
                    </ul>
                </Section>

                <Section title="3. Account Registration">
                    <p>Free plan users do not need to create an account. Premium plan users must register with a valid email address and password. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately at <a href="mailto:support@tempymail.site" className="text-primary hover:underline">support@tempymail.site</a> of any unauthorized use of your account.</p>
                </Section>

                <Section title="4. Acceptable Use">
                    <p>You agree to use the Service only for lawful purposes. You must not use the Service to:</p>
                    <ul className="list-disc pl-5 mt-3 space-y-2">
                        <li>Send, receive, store, or transmit any content that is illegal, harmful, threatening, abusive, defamatory, obscene, or otherwise objectionable.</li>
                        <li>Violate any applicable local, national, or international law or regulation.</li>
                        <li>Circumvent security systems, spam filters, or abuse-detection mechanisms of third-party services.</li>
                        <li>Engage in mass account creation or automated abuse of the Service.</li>
                        <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity.</li>
                        <li>Interfere with or disrupt the integrity or performance of the Service.</li>
                    </ul>
                    <p className="mt-3">We reserve the right to suspend or terminate your access to the Service immediately if we determine, in our sole discretion, that you have violated these Terms.</p>
                </Section>

                <Section title="5. Payments and Billing">
                    <p>Premium subscriptions are billed monthly at $4.99/month. Payments are processed securely through Paystack. By subscribing, you authorize us to charge your payment method on a recurring monthly basis until you cancel. All prices are in US Dollars (USD).</p>
                    <p className="mt-3">Subscription fees are non-refundable except as described in our <a href="/refund" className="text-primary hover:underline">Refund Policy</a>. You may cancel your subscription at any time through your Profile page; cancellation takes effect at the end of the current billing period.</p>
                </Section>

                <Section title="6. Data and Privacy">
                    <p>Temporary email sessions for free users are anonymous and are automatically deleted after 1 hour. Premium inbox data is retained for up to 7 days. We do not sell your personal data. For full details on how we handle your information, please review our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.</p>
                </Section>

                <Section title="7. Intellectual Property">
                    <p>The Service and its original content, features, and functionality are and will remain the exclusive property of TempyMail. You may not copy, modify, distribute, sell, or lease any part of the Service without our express written permission.</p>
                </Section>

                <Section title="8. Disclaimers and Limitation of Liability">
                    <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis without any warranties of any kind, either express or implied. TempyMail does not guarantee that the Service will be uninterrupted, secure, or error-free.</p>
                    <p className="mt-3">To the maximum extent permitted by applicable law, TempyMail shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of or inability to use the Service, even if TempyMail has been advised of the possibility of such damages. Our total liability to you for any claims arising from your use of the Service shall not exceed the amount paid by you to TempyMail in the three months preceding the claim.</p>
                </Section>

                <Section title="9. Termination">
                    <p>We may terminate or suspend your access to the Service at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, third parties, or for any other reason. Upon termination, your right to use the Service will immediately cease.</p>
                </Section>

                <Section title="10. Changes to Terms">
                    <p>We reserve the right to modify these Terms at any time. We will notify users of significant changes by updating the "Last updated" date at the top of this page. Your continued use of the Service after changes constitute your acceptance of the new Terms.</p>
                </Section>

                <Section title="11. Governing Law">
                    <p>These Terms shall be governed by and construed in accordance with applicable laws. Any disputes relating to the Service shall be resolved through good-faith negotiation. If resolution cannot be reached, disputes shall be submitted to binding arbitration.</p>
                </Section>

                <Section title="12. Contact Us">
                    <p>If you have any questions about these Terms, please contact us at:</p>
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
