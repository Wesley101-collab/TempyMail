import React, { useState } from 'react';
import { Shield, Mail, Lock, ArrowLeft, Loader2, Crown, Check, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function PremiumAuth({ onBack, onSuccess }) {
    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (mode === 'signup') {
                if (password.length < 6) {
                    setError('Password must be at least 6 characters');
                    setLoading(false);
                    return;
                }
                // Sign up
                const { data: signupData } = await api.post('/premium/signup', { email, password });
                setSuccess(signupData.message);

                // Initialize payment
                const { data: payData } = await api.post('/payment/initialize', { email });
                if (payData.authorization_url) {
                    localStorage.setItem('premium_email', email);
                    window.location.href = payData.authorization_url;
                }
            } else {
                // Log in
                const { data } = await api.post('/premium/login', { email, password });
                if (data.success) {
                    localStorage.setItem('premium_email', data.user.email);
                    localStorage.setItem('premium_user', JSON.stringify(data.user));
                    if (onSuccess) onSuccess(data.user);
                }
            }
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen app-bg flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Back button */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to home</span>
                </button>

                {/* Card */}
                <div className="glass-panel p-8 md:p-10 relative overflow-hidden">
                    {/* Crown icon */}
                    <div className="flex justify-center mb-6">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 shadow-[0_0_30px_rgba(102,252,241,0.1)]">
                            <Crown className="w-10 h-10 text-primary" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-extrabold text-center text-text-main mb-2 tracking-tight">
                        {mode === 'login' ? 'Welcome Back' : 'Go Premium'}
                    </h1>
                    <p className="text-text-muted text-center mb-8 text-sm">
                        {mode === 'login'
                            ? 'Sign in to your premium account'
                            : 'Unlimited emails, AI summaries & more'}
                    </p>

                    {/* Premium benefits (only on signup) */}
                    {mode === 'signup' && (
                        <div className="mb-8 p-4 rounded-xl bg-surface-hover border border-white/5 space-y-2.5">
                            {['Unlimited temp emails', 'AI email summarizer', 'Download emails', 'Extended inbox (24h)', 'Ad-free experience'].map((item) => (
                                <div key={item} className="flex items-center gap-2.5 text-sm">
                                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                    <span className="text-text-main">{item}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="text-primary font-bold">$4.99/month</span>
                            </div>
                        </div>
                    )}

                    {/* Error/Success */}
                    {error && (
                        <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-5 p-3.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium">
                            {success}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2 block">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-white/10 text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2 block">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-white/10 text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-teal-400 text-background font-bold text-sm tracking-wide hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(102,252,241,0.2)]"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : mode === 'signup' ? (
                                <>
                                    <Shield className="w-4 h-4" />
                                    Sign Up & Pay — $4.99/mo
                                </>
                            ) : (
                                <>
                                    <Shield className="w-4 h-4" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle mode */}
                    <div className="mt-6 text-center text-sm">
                        <span className="text-text-muted">
                            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                        </span>
                        <button
                            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccess(null); }}
                            className="text-primary font-semibold hover:underline"
                        >
                            {mode === 'login' ? 'Sign Up' : 'Sign In'}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-text-muted/50 text-xs mt-6">
                    Secured with end-to-end encryption • TempyMail © 2026
                </p>
            </div>
        </div>
    );
}
