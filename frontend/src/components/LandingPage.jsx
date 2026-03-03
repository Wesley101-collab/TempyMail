import React from 'react';
import { Mail, Shield, Zap, Sparkles, Check, X, Sun, Moon, RefreshCcw } from 'lucide-react';

export default function LandingPage({ onGetStarted, loading, theme, toggleTheme }) {
    return (
        <div className="min-h-screen flex flex-col app-bg relative overflow-hidden">
            <button
                onClick={toggleTheme}
                className="absolute top-4 right-4 z-50 p-3 rounded-full glass-card hover:border-primary transition-all cursor-pointer"
                title="Toggle Theme"
            >
                {theme === 'dark' ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-slate-700" />}
            </button>

            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center p-6 pt-20 pb-10 text-center">
                <div className="relative z-10 max-w-3xl w-full">
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div className="p-4 bg-primary/20 rounded-2xl shadow-lg border border-primary/30">
                            <Mail className="w-14 h-14 text-primary" />
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-5 bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-secondary tracking-tight leading-tight">
                        TempyMail
                    </h1>
                    <p className="text-text-muted text-lg md:text-xl mb-6 max-w-xl mx-auto leading-relaxed font-medium">
                        Instant disposable email addresses. Your privacy, our priority.
                    </p>
                    <p className="text-text-muted/70 text-sm mb-10 max-w-md mx-auto">
                        No signup. No tracking. No spam. Just a clean, temporary inbox in seconds.
                    </p>

                    <button
                        onClick={onGetStarted}
                        disabled={loading}
                        className="glass-button px-12 py-5 text-lg font-bold tracking-wider gap-3 disabled:opacity-50 disabled:cursor-wait mb-16 mx-auto hover:scale-105 transition-transform"
                    >
                        {loading ? (
                            <>
                                <RefreshCcw className="w-6 h-6 animate-spin" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Mail className="w-6 h-6" />
                                <span>Get Temp Email — Free</span>
                            </>
                        )}
                    </button>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left mb-20">
                        <div className="glass-card p-8 group">
                            <Zap className="w-10 h-10 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
                            <h3 className="font-bold text-text-main mb-1.5 text-lg">Instant</h3>
                            <p className="text-text-muted text-sm leading-relaxed">Get a working email in seconds. No forms, no waiting, no hassle.</p>
                        </div>
                        <div className="glass-card p-8 group">
                            <Shield className="w-10 h-10 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
                            <h3 className="font-bold text-text-main mb-1.5 text-lg">Private</h3>
                            <p className="text-text-muted text-sm leading-relaxed">Your identity stays protected. Zero personal data required.</p>
                        </div>
                        <div className="glass-card p-8 group">
                            <Sparkles className="w-10 h-10 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
                            <h3 className="font-bold text-text-main mb-1.5 text-lg">AI-Powered</h3>
                            <p className="text-text-muted text-sm leading-relaxed">Summarize long emails instantly with our built-in AI summarizer.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="w-full max-w-4xl mx-auto px-6 pb-20" id="pricing">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 text-text-main">Simple Pricing</h2>
                <p className="text-text-muted text-center mb-12 text-lg">Start free. Upgrade when you need more.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Free Plan */}
                    <div className="glass-card p-8 flex flex-col">
                        <h3 className="text-xl font-bold text-text-main mb-2">Free</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-extrabold text-text-main">$0</span>
                            <span className="text-text-muted text-sm">/forever</span>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1">
                            <PricingItem included>3 temp emails per day</PricingItem>
                            <PricingItem included>AI email summarizer</PricingItem>
                            <PricingItem included>Download emails</PricingItem>
                            <PricingItem included>Session history (5 inboxes)</PricingItem>
                            <PricingItem>Custom email alias</PricingItem>
                            <PricingItem>Extended inbox (24h)</PricingItem>
                            <PricingItem>Ad-free experience</PricingItem>
                        </ul>
                        <button
                            onClick={onGetStarted}
                            disabled={loading}
                            className="w-full glass-button py-3 font-bold text-sm"
                        >
                            Get Started Free
                        </button>
                    </div>

                    {/* Premium Plan */}
                    <div className="glass-card p-8 flex flex-col border-primary/40 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-primary text-background text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                            POPULAR
                        </div>
                        <h3 className="text-xl font-bold text-text-main mb-2">Premium</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-extrabold text-primary">$4.99</span>
                            <span className="text-text-muted text-sm">/month</span>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1">
                            <PricingItem included>Unlimited temp emails</PricingItem>
                            <PricingItem included>AI email summarizer</PricingItem>
                            <PricingItem included>Download emails</PricingItem>
                            <PricingItem included>Session history (5 inboxes)</PricingItem>
                            <PricingItem included>Custom email alias</PricingItem>
                            <PricingItem included>Extended inbox (24h)</PricingItem>
                            <PricingItem included>Ad-free experience</PricingItem>
                        </ul>
                        <button
                            onClick={async () => {
                                const email = prompt('Enter your email:');
                                if (!email) return;
                                const password = prompt('Create a password (min 6 characters):');
                                if (!password || password.length < 6) {
                                    alert('Password must be at least 6 characters.');
                                    return;
                                }
                                try {
                                    const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                                    // Try signup first
                                    const signupRes = await fetch(`${API}/premium/signup`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ email, password }),
                                    });
                                    const signupData = await signupRes.json();
                                    if (!signupRes.ok && signupData.detail !== 'Account already exists. Please log in.') {
                                        alert(signupData.detail || 'Signup failed');
                                        return;
                                    }
                                    // Initialize payment
                                    const payRes = await fetch(`${API}/payment/initialize`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ email }),
                                    });
                                    const payData = await payRes.json();
                                    if (payData.authorization_url) {
                                        localStorage.setItem('premium_email', email);
                                        window.location.href = payData.authorization_url;
                                    } else {
                                        alert('Payment service is being set up. Please try again later.');
                                    }
                                } catch (err) {
                                    alert('Payment service is being set up. Please try again later.');
                                }
                            }}
                            className="w-full bg-primary hover:bg-primary/90 text-background font-bold py-3 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                        >
                            Get Premium — $4.99/mo
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full border-t border-border py-8 px-6 text-center">
                <p className="text-text-muted text-sm">
                    © 2026 TempyMail — Built with privacy in mind. Powered by <span className="text-primary font-semibold">vredobox.cc</span>
                </p>
            </footer>
        </div>
    );
}

function PricingItem({ children, included }) {
    return (
        <li className="flex items-center gap-3 text-sm">
            {included ? (
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
                <X className="w-4 h-4 text-text-muted/40 flex-shrink-0" />
            )}
            <span className={included ? 'text-text-main' : 'text-text-muted/50'}>{children}</span>
        </li>
    );
}
