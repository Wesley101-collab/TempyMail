import React, { useState } from 'react';
import { Shield, Mail, Lock, ArrowLeft, Loader2, Crown, Check, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function PremiumAuth({ onBack, onSuccess }) {
    const [mode, setMode] = useState('signup'); // 'login' | 'signup'
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
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative text-textMain">

            <div className="w-full max-w-md relative z-10">
                {/* Back button */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-textMuted hover:text-textMain transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Home</span>
                </button>

                {/* Card */}
                <div className="dashboard-panel p-8 md:p-10">
                    {/* Crown icon */}
                    <div className="flex justify-center mb-6">
                        <div className="p-4 rounded-xl bg-green-50 text-primary border border-green-100 shadow-sm">
                            <Crown className="w-8 h-8" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-2 tracking-tight">
                        {mode === 'login' ? 'Welcome Back' : 'Go Premium'}
                    </h1>
                    <p className="text-textMuted text-center mb-8 text-sm max-w-[280px] mx-auto">
                        {mode === 'login'
                            ? 'Sign in to access your premium features.'
                            : 'Unlock unlimited emails, AI summaries, and permanent routing.'}
                    </p>

                    {/* Premium benefits (only on signup) */}
                    {mode === 'signup' && (
                        <div className="mb-8 p-5 rounded-xl bg-surfaceHover border border-border space-y-3">
                            {['Unlimited temporary emails', 'Unlimited AI summaries', 'Download full inboxes', 'Extended inbox (24h)', 'Ad-free experience'].map((item) => (
                                <div key={item} className="flex items-center gap-3 text-sm">
                                    <div className="bg-green-100 text-primary rounded-full p-0.5">
                                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                    </div>
                                    <span className="font-medium text-gray-700">{item}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="font-bold text-gray-900">$4.99 / month</span>
                            </div>
                        </div>
                    )}

                    {/* Error/Success */}
                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                            {success}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-gray-700 text-sm font-bold mb-1.5 block">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface border border-border text-textMain placeholder:text-textMuted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-medium text-sm shadow-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-gray-700 text-sm font-bold mb-1.5 block">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface border border-border text-textMain placeholder:text-textMuted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-medium text-sm shadow-sm"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-lg btn-primary shadow-md hover:-translate-y-0.5 active:translate-y-0 text-sm transition-all"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : mode === 'signup' ? (
                                    <>
                                        Sign Up & Pay — $4.99/mo
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Toggle mode */}
                    <div className="mt-8 text-center text-sm font-medium">
                        <span className="text-textMuted">
                            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                        </span>
                        <button
                            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccess(null); }}
                            className="text-primary hover:text-secondary group transition-colors"
                        >
                            {mode === 'login' ? 'Sign Up' : 'Sign In'}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-textMuted/60 text-xs mt-8 font-medium">
                    <p>Secured with end-to-end encryption</p>
                    <p className="mt-1">TempyMail © 2026</p>
                </div>
            </div>
        </div>
    );
}
