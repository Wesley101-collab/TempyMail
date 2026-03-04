import React from 'react';
import { Mail, Shield, Zap, Sparkles, Check, X, RefreshCcw, ArrowRight } from 'lucide-react';

export default function LandingPage({ onGetStarted, loading }) {
    return (
        <div className="min-h-screen flex flex-col bg-background relative overflow-hidden text-textMain">

            {/* Header / Navbar */}
            <header className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="bg-primary p-1.5 rounded-lg">
                        <Mail className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">
                        TempyMail
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <a href="#pricing" className="text-sm font-medium text-textMuted hover:text-textMain transition-colors hidden sm:block">Pricing</a>
                    <button
                        onClick={() => { window.history.pushState({}, '', '/premium'); window.location.reload(); }}
                        className="text-sm font-bold text-primary hover:text-secondary transition-colors"
                    >
                        Login
                    </button>
                    <button
                        onClick={onGetStarted}
                        disabled={loading}
                        className="btn-primary px-4 py-2 text-sm font-bold shadow-sm"
                    >
                        Try Free
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center p-6 pt-24 pb-16 text-center">
                <div className="relative z-10 max-w-4xl w-full">

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-primary text-sm font-bold mb-8 border border-green-200">
                        <Sparkles className="w-4 h-4" />
                        <span>Now with AI Summaries</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight text-gray-900">
                        Your private inbox,<br />
                        <span className="text-primary">instantly ready.</span>
                    </h1>

                    <p className="text-textMuted text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                        Keep your real inbox clean and secure. Generate a disposable email address in one click to block spam, tracking, and unwanted newsletters.
                    </p>

                    <button
                        onClick={onGetStarted}
                        disabled={loading}
                        className="btn-primary px-10 py-4 text-lg gap-3 disabled:opacity-50 disabled:cursor-wait mx-auto hover:-translate-y-1 transition-transform shadow-lg shadow-green-500/20"
                    >
                        {loading ? (
                            <>
                                <RefreshCcw className="w-6 h-6 animate-spin" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Mail className="w-6 h-6" />
                                <span>Get Your Temporary Email</span>
                                <ArrowRight className="w-5 h-5 ml-1" />
                            </>
                        )}
                    </button>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left mt-24">
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
                </div>
            </section>

            {/* Pricing Section */}
            <section className="w-full bg-surface border-y border-border py-24" id="pricing">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900">Simple, transparent pricing</h2>
                        <p className="text-textMuted text-lg max-w-2xl mx-auto">Start with our free plan to protect your inbox immediately. Upgrade for advanced features and permanent routing.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pl-4 pr-4">
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
                                <PricingItem included>AI email summarizer (10/day)</PricingItem>
                                <PricingItem included>Download individual emails</PricingItem>
                                <PricingItem included>Browser session history</PricingItem>
                                <PricingItem>Custom persistent aliases</PricingItem>
                                <PricingItem>Extended inbox lifetime (24h)</PricingItem>
                                <PricingItem>Ad-free experience</PricingItem>
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
                                <PricingItem included>Download entire inboxes</PricingItem>
                                <PricingItem included>Cloud session history</PricingItem>
                                <PricingItem included>Custom persistent aliases</PricingItem>
                                <PricingItem included>Extended inbox lifetime (24h)</PricingItem>
                                <PricingItem included>Ad-free experience</PricingItem>
                            </ul>
                            <button
                                onClick={() => { window.history.pushState({}, '', '/premium'); window.location.reload(); }}
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
                </div>
            </footer>
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
