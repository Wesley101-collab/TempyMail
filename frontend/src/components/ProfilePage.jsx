import React, { useState, useEffect } from 'react';
import {
    User, Mail, Shield, Crown, LogOut, ArrowLeft, Trash2, Clock,
    Loader2, AlertTriangle, Check, ChevronRight, Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function ProfilePage({ onBack, onLogout }) {
    const [user, setUser] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('premium_user');
        if (stored) {
            try { setUser(JSON.parse(stored)); } catch { }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('premium_user');
        localStorage.removeItem('premium_email');
        if (onLogout) onLogout();
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        try {
            // Attempt to delete on backend (if endpoint exists)
            await api.delete(`/premium/user/${user?.email}`).catch(() => { });
            localStorage.removeItem('premium_user');
            localStorage.removeItem('premium_email');
            if (onLogout) onLogout();
        } finally {
            setDeleteLoading(false);
        }
    };

    const isPremium = user?.is_premium;

    // If not logged in, show a login prompt
    if (!user) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-textMain">
                <div className="w-full max-w-md">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-textMuted hover:text-textMain transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Inbox</span>
                    </button>

                    <div className="dashboard-panel p-8 md:p-10 text-center">
                        <div className="mx-auto w-20 h-20 rounded-full bg-surfaceHover flex items-center justify-center mb-6">
                            <User className="w-10 h-10 text-textMuted" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">No Account</h2>
                        <p className="text-textMuted text-sm mb-6">Sign in or create a premium account to access your profile.</p>
                        <button
                            onClick={onBack}
                            className="btn-primary w-full py-3 rounded-lg text-sm font-bold"
                        >
                            Go to Premium Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center p-4 pt-12 text-textMain">
            <div className="w-full max-w-lg">
                {/* Back button */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-textMuted hover:text-textMain transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Inbox</span>
                </button>

                {/* Profile Card */}
                <div className="dashboard-panel p-8 md:p-10 mb-6">
                    {/* Avatar */}
                    <div className="flex flex-col items-center mb-8">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 border-2 ${isPremium
                                ? 'bg-primary/10 border-primary/30 text-primary'
                                : 'bg-surfaceHover border-border text-textMuted'
                            }`}>
                            <User className="w-12 h-12" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                            {user.email?.split('@')[0] || 'User'}
                        </h1>
                        <p className="text-textMuted text-sm mt-1">{user.email}</p>

                        {/* Premium badge */}
                        {isPremium ? (
                            <div className="mt-3 flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                                <Crown className="w-3.5 h-3.5" />
                                Premium Member
                            </div>
                        ) : (
                            <div className="mt-3 flex items-center gap-1.5 bg-surfaceHover text-textMuted px-3 py-1 rounded-full text-xs font-bold">
                                <Shield className="w-3.5 h-3.5" />
                                Free Tier
                            </div>
                        )}
                    </div>

                    {/* Account Info */}
                    <div className="space-y-1">
                        <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-3">Account Details</h3>

                        <div className="flex items-center justify-between p-3.5 rounded-lg bg-surfaceHover">
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-textMuted" />
                                <span className="text-sm font-medium">Email</span>
                            </div>
                            <span className="text-sm text-textMuted font-mono">{user.email}</span>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-lg bg-surfaceHover">
                            <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-textMuted" />
                                <span className="text-sm font-medium">Member Since</span>
                            </div>
                            <span className="text-sm text-textMuted">
                                {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-lg bg-surfaceHover">
                            <div className="flex items-center gap-3">
                                <Shield className="w-4 h-4 text-textMuted" />
                                <span className="text-sm font-medium">Plan</span>
                            </div>
                            <span className={`text-sm font-bold ${isPremium ? 'text-primary' : 'text-textMuted'}`}>
                                {isPremium ? 'Premium' : 'Free'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Premium Upsell (if not premium) */}
                {!isPremium && (
                    <div className="dashboard-panel p-6 mb-6 border-primary/20">
                        <div className="flex items-start gap-4">
                            <div className="bg-primary/10 p-2.5 rounded-xl flex-shrink-0">
                                <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 mb-1">Upgrade to Premium</h3>
                                <p className="text-xs text-textMuted mb-3">Get unlimited emails, AI summaries, and more for just $4.99/mo</p>
                                <button className="btn-primary text-xs px-4 py-2 rounded-lg font-bold">
                                    Upgrade Now
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-surface border border-border hover:bg-surfaceHover transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <LogOut className="w-4 h-4 text-textMuted" />
                            <span className="text-sm font-semibold text-textMain">Log Out</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-textMuted group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-surface border border-red-200 hover:bg-red-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <Trash2 className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-semibold text-red-600">Delete Account</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="dashboard-panel p-8 max-w-sm w-full text-center">
                            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                                <AlertTriangle className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Delete Account?</h3>
                            <p className="text-textMuted text-sm mb-6">This action cannot be undone. All your data will be permanently removed.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-3 rounded-lg border border-border text-sm font-bold text-textMain hover:bg-surfaceHover transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteLoading}
                                    className="flex-1 py-3 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
                                >
                                    {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center text-textMuted/50 text-xs mt-8 mb-4 font-medium">
                    <p>TempyMail © 2026</p>
                </div>
            </div>
        </div>
    );
}
