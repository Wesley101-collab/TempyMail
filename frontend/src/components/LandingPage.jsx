import React from 'react';
import {
    Mail, Shield, Zap, Sparkles, Check, X, RefreshCcw, ArrowRight,
    AtSign, Forward, Reply, Paperclip, Webhook, Inbox, Download, Clock, Phone, MessageSquare
} from 'lucide-react';

export default function LandingPage({ onGetStarted, loading, onGoToPremium, onNumbersClick, onLegalPage }) {
    return (
        <div className="min-h-screen flex flex-col bg-background relative overflow-hidden text-textMain">

            {/* Header / Navbar */}
            <header className="bg-surface border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="bg-primary p-1.5 rounded-lg">
                        <Mail className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-lg sm:text-xl font-bold tracking-tight">TempyMail</h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <a href="#features" className="text-sm font-medium text-textMuted hover:text-textMain transition-colors hidden sm:block">Features</a>
                    <button onClick={onNumbersClick} className="text-sm font-medium text-textMuted hover:text-textMain transition-colors hidden sm:block">Temp Numbers</button>
                    <a href="#pricing" className="text-sm font-medium text-textMuted hover:text-textMain transition-colors hidden sm:block">Pricing</a>
                    <button
                        onClick={onGoToPremium}
                        className="text-xs sm:text-sm font-bold text-primary hover:text-secondary transition-colors"
                    >
                        Login
                    </button>
                    <button
                        onClick={onGetStarted}
                        disabled={loading}
                        className="btn-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold shadow-sm"
                    >
                        Try Free
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-12 sm:pt-24 pb-10 sm:pb-16 text-center">
                <div className="relative z-10 max-w-4xl w-full">

                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-green-50 text-primary text-xs sm:text-sm font-bold mb-6 sm:mb-8 border border-green-200">
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Now with AI Summaries, Forwarding & Reply</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold mb-4 sm:mb-6 tracking-tight leading-tight text-gray-900">
                        Your private inbox,<br />
                        <span className="text-primary">instantly ready.</span>
                    </h1>

                    <p className="text-textMuted text-sm sm:text-lg md:text-xl mb-6 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
                        Keep your real inbox clean and secure. Generate a disposable email address in one click — with custom aliases, forwarding, attachments, and reply support.
                    </p>

                    <button
                        onClick={onGetStarted}
                        disabled={loading}
                        className="btn-primary px-6 sm:px-10 py-3 sm:py-4 text-sm sm:text-lg gap-2 sm:gap-3 disabled:opacity-50 disabled:cursor-wait mx-auto hover:-translate-y-1 transition-transform shadow-lg shadow-green-500/20"
                    >
                        {loading ? (
                            <>
                                <RefreshCcw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                                <span>Get Your Temporary Email</span>
                                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />
                            </>
                        )}
                    </button>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-left mt-12 sm:mt-24">
                        <div className="dashboard-card p-8 group hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-6 border border-blue-100 group-hover:scale-110 transition-transform">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2 text-lg">Lightning Fast</h3>
                            <p className="text-textMuted text-sm leading-relaxed">Get a working email address in less than a second. No signups, no forms.</p>
                        </div>
                        <div className="dashboard-card p-8 group hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-green-50 text-primary rounded-xl flex items-center justify-center mb-6 border border-green-100 group-hover:scale-110 transition-transform">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2 text-lg">Total Privacy</h3>
                            <p className="text-textMuted text-sm leading-relaxed">We don't track you. Your identity is hidden, and emails are securely deleted.</p>
                        </div>
                        <div className="dashboard-card p-8 group hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center mb-6 border border-purple-100 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2 text-lg">AI Summarizer</h3>
                            <p className="text-textMuted text-sm leading-relaxed">Too long, didn't read? Let our AI instantly summarize long, boring emails for you.</p>
                        </div>
                    </div>

                    {/* Temp Numbers CTA */}
                    <div className="mt-12 sm:mt-20 dashboard-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 border-primary/30 hover:border-primary/60 transition-colors cursor-pointer group" onClick={onNumbersClick}>
                        <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <Phone className="w-7 h-7 text-primary" />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h3 className="font-bold text-gray-900 text-lg mb-1 flex items-center justify-center sm:justify-start gap-2">
                                Free Temporary Phone Numbers
                                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-bold">NEW</span>
                            </h3>
                            <p className="text-textMuted text-sm leading-relaxed">Receive SMS online with 45+ free phone numbers from the US, UK, Canada, Germany, and more. View verification codes instantly — no signup needed.</p>
                        </div>
                        <button className="btn-primary px-5 py-2.5 text-sm font-bold gap-2 whitespace-nowrap flex-shrink-0">
                            <MessageSquare className="w-4 h-4" />
                            Browse Numbers
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Premium Features Grid */}
            <section className="w-full bg-surface border-y border-border py-12 sm:py-24" id="features">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900">Premium Superpowers</h2>
                        <p className="text-textMuted text-lg max-w-2xl mx-auto">Everything you need for complete disposable email control.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                        <FeatureCard icon={AtSign} color="blue" title="Custom Aliases" desc="Choose your own username like myname@vredobox.cc" />
                        <FeatureCard icon={Inbox} color="green" title="Multiple Inboxes" desc="Run up to 5 inboxes simultaneously" />
                        <FeatureCard icon={Forward} color="purple" title="Email Forwarding" desc="Auto-forward incoming mail to your real inbox" />
                        <FeatureCard icon={Reply} color="orange" title="Reply to Emails" desc="Send replies directly from your temp address" />
                        <FeatureCard icon={Paperclip} color="pink" title="Attachments" desc="View and download email attachments" />
                        <FeatureCard icon={Download} color="teal" title="Download Emails" desc="Export individual .eml or full inbox as .zip" />
                        <FeatureCard icon={Clock} color="amber" title="7-Day Retention" desc="Emails last 7 days instead of 1 hour" />
                        <FeatureCard icon={Webhook} color="indigo" title="Webhook Alerts" desc="Get HTTP notifications for new emails" />
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="w-full bg-background py-12 sm:py-24" id="pricing">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900">Simple, transparent pricing</h2>
                        <p className="text-textMuted text-lg max-w-2xl mx-auto">Start free. Upgrade when you need more power.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
                        {/* Free Plan */}
                        <div className="dashboard-card p-8 flex flex-col">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Free Plan</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-extrabold text-gray-900">$0</span>
                                <span className="text-textMuted font-medium">/ forever</span>
                            </div>
                            <p className="text-sm text-textMuted mb-8 pb-8 border-b border-border">Perfect for quick signups and verification emails.</p>

                            <ul className="space-y-4 mb-8 flex-1">
                                <PricingItem included>3 temporary emails per day</PricingItem>
                                <PricingItem included>AI email summarizer</PricingItem>
                                <PricingItem included>1-hour inbox lifetime</PricingItem>
                                <PricingItem included>Download individual emails</PricingItem>
                                <PricingItem included>Browser session history</PricingItem>
                                <PricingItem>Custom aliases</PricingItem>
                                <PricingItem>Multiple inboxes</PricingItem>
                                <PricingItem>Email forwarding & reply</PricingItem>
                                <PricingItem>Attachment support</PricingItem>
                                <PricingItem>Webhook notifications</PricingItem>
                            </ul>
                            <button
                                onClick={onGetStarted}
                                disabled={loading}
                                className="w-full btn-secondary py-3 text-sm"
                            >
                                Start for Free
                            </button>
                        </div>

                        {/* Premium Plan */}
                        <div className="dashboard-card p-8 flex flex-col border-primary shadow-lg shadow-green-500/10 relative overflow-hidden border-2">
                            <div className="absolute top-5 right-5 bg-green-100 text-primary text-xs font-bold px-3 py-1 rounded-full">
                                POPULAR
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Premium</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-extrabold text-primary">$4.99</span>
                                <span className="text-textMuted font-medium">/ month</span>
                            </div>
                            <p className="text-sm text-textMuted mb-8 pb-8 border-b border-border">For power users who need complete email privacy control.</p>

                            <ul className="space-y-4 mb-8 flex-1">
                                <PricingItem included>Unlimited temporary emails</PricingItem>
                                <PricingItem included>Unlimited AI summaries</PricingItem>
                                <PricingItem included>7-day inbox lifetime</PricingItem>
                                <PricingItem included>Download full inboxes (.zip)</PricingItem>
                                <PricingItem included>Custom persistent aliases</PricingItem>
                                <PricingItem included>Up to 5 active inboxes</PricingItem>
                                <PricingItem included>Email forwarding</PricingItem>
                                <PricingItem included>Reply to emails</PricingItem>
                                <PricingItem included>Attachment support</PricingItem>
                                <PricingItem included>Webhook notifications</PricingItem>
                            </ul>
                            <button
                                onClick={onGoToPremium}
                                className="w-full btn-primary py-3 hover:-translate-y-0.5 shadow-md shadow-green-500/20 text-sm"
                            >
                                Upgrade to Premium
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full bg-background py-10 px-6 border-t border-border">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-lg">
                            <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-bold text-gray-900">TempyMail</span>
                    </div>
                    <p className="text-textMuted text-sm">
                        © 2026 TempyMail. Protected by <a href="#" className="font-medium hover:text-primary transition-colors">vredobox.cc</a>
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                        <button onClick={() => onLegalPage('terms', '/terms')} className="text-textMuted hover:text-primary transition-colors">Terms</button>
                        <button onClick={() => onLegalPage('privacy', '/privacy')} className="text-textMuted hover:text-primary transition-colors">Privacy</button>
                        <button onClick={() => onLegalPage('refund', '/refund')} className="text-textMuted hover:text-primary transition-colors">Refund Policy</button>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, color, title, desc }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-500 border-blue-100',
        green: 'bg-green-50 text-green-600 border-green-100',
        purple: 'bg-purple-50 text-purple-500 border-purple-100',
        orange: 'bg-orange-50 text-orange-500 border-orange-100',
        pink: 'bg-pink-50 text-pink-500 border-pink-100',
        teal: 'bg-teal-50 text-teal-600 border-teal-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        indigo: 'bg-indigo-50 text-indigo-500 border-indigo-100',
    };
    return (
        <div className="dashboard-card p-6 group hover:shadow-md transition-shadow text-center">
            <div className={`w-11 h-11 ${colors[color]} rounded-xl flex items-center justify-center mb-4 border mx-auto group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-sm">{title}</h3>
            <p className="text-textMuted text-xs leading-relaxed">{desc}</p>
        </div>
    );
}

function PricingItem({ children, included }) {
    return (
        <li className="flex items-start gap-3 text-sm">
            <div className={`mt-0.5 rounded-full p-0.5 flex-shrink-0 ${included ? 'bg-green-100 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                {included ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                ) : (
                    <X className="w-3.5 h-3.5" strokeWidth={3} />
                )}
            </div>
            <span className={included ? 'text-gray-700 font-medium' : 'text-gray-400'}>{children}</span>
        </li>
    );
}
