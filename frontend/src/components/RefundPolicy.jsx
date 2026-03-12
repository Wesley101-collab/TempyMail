import React from 'react';
import { Mail, ArrowLeft } from 'lucide-react';

export default function RefundPolicy({ onBack }) {
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
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Refund Policy</h1>
                <p className="text-textMuted text-sm mb-10">Last updated: March 12, 2026</p>

                {/* Summary Card */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-10">
                    <p className="text-sm font-bold text-primary mb-1">📌 Summary</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        New Premium subscribers may request a full refund within <strong>7 days</strong> of their first payment. After 7 days, all sales are final. The free plan has no charges and requires no refund. To request a refund, email us at{' '}
                        <a href="mailto:support@tempymail.site" className="text-primary hover:underline font-medium">support@tempymail.site</a>.
                    </p>
                </div>

                <Section title="1. Free Plan">
                    <p>The TempyMail Free plan is available at no cost. No payment is required, and therefore no refund policy applies to free plan usage.</p>
                </Section>

                <Section title="2. Premium Plan — 7-Day Money-Back Guarantee">
                    <p>We want you to be completely satisfied with your TempyMail Premium subscription. If for any reason you are not satisfied, we offer a <strong>full refund within 7 calendar days</strong> of your initial subscription payment.</p>
                    <p className="mt-3">To qualify for a refund under this guarantee:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-2">
                        <li>Your refund request must be submitted within 7 days of your first payment.</li>
                        <li>The request must come from the email address associated with your TempyMail Premium account.</li>
                        <li>This guarantee applies to <strong>first-time subscribers only</strong>. It does not apply to renewals or resubscriptions.</li>
                    </ul>
                </Section>

                <Section title="3. Renewals and Subsequent Billing Cycles">
                    <p>Monthly renewal charges are <strong>non-refundable</strong>. If you do not wish to be charged for the next billing period, you must cancel your subscription before the renewal date. You can cancel at any time from your Profile page within the TempyMail app.</p>
                    <p className="mt-3">Upon cancellation, you retain access to Premium features until the end of your current paid billing period. No partial refunds are issued for unused portions of a subscription period.</p>
                </Section>

                <Section title="4. How to Request a Refund">
                    <p>To request a refund, please contact our support team:</p>
                    <div className="mt-4 bg-surface border border-border rounded-xl p-5 space-y-2">
                        <p className="text-sm"><strong>Email:</strong> <a href="mailto:support@tempymail.site" className="text-primary hover:underline">support@tempymail.site</a></p>
                        <p className="text-sm"><strong>Subject:</strong> Refund Request — TempyMail Premium</p>
                        <p className="text-sm"><strong>Include:</strong> The email address on your account and the date of your payment.</p>
                    </div>
                    <p className="mt-4">We aim to respond to all refund requests within <strong>2 business days</strong>. Once approved, refunds are processed through Paystack and may take <strong>5–10 business days</strong> to appear on your statement depending on your bank or card provider.</p>
                </Section>

                <Section title="5. Disputes and Chargebacks">
                    <p>We encourage you to contact us directly before initiating a chargeback with your bank or card provider. We are happy to resolve any billing issues quickly and fairly. Unresolved disputes may result in the suspension of your account.</p>
                </Section>

                <Section title="6. Changes to This Policy">
                    <p>We reserve the right to update this Refund Policy at any time. Changes will be posted on this page with an updated "Last updated" date. Continued use of the Service after changes constitutes acceptance of the revised policy.</p>
                </Section>

                <Section title="7. Contact Us">
                    <p>For any refund-related questions, please contact us at:</p>
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
