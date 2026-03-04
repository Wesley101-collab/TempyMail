import React, { useState, useEffect } from 'react';
import {
    User, Mail, Shield, Crown, LogOut, ArrowLeft, Trash2, Clock,
    Loader2, AlertTriangle, Check, ChevronRight, Sparkles,
    AtSign, Forward, Webhook, Plus, X, Copy, Inbox
} from 'lucide-react';
import { api } from '../services/api';

function SettingRow({ icon: Icon, label, description, children }) {
    return (
        <div className="p-4 rounded-xl bg-surfaceHover border border-border">
            <div className="flex items-start gap-3 mb-3">
                <div className="p-1.5 bg-primary/10 rounded-lg mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-textMain">{label}</h4>
                    {description && <p className="text-xs text-textMuted mt-0.5">{description}</p>}
                </div>
            </div>
            <div className="ml-10">{children}</div>
        </div>
    );
}

export default function ProfilePage({ onBack, onLogout }) {
    const [user, setUser] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Settings state
    const [alias, setAlias] = useState('');
    const [aliasSaving, setAliasSaving] = useState(false);
    const [aliasMsg, setAliasMsg] = useState(null);
    const [forwardTo, setForwardTo] = useState('');
    const [forwardSaving, setForwardSaving] = useState(false);
    const [forwardMsg, setForwardMsg] = useState(null);
    const [webhookUrl, setWebhookUrl] = useState('');
    const [webhookSaving, setWebhookSaving] = useState(false);
    const [webhookMsg, setWebhookMsg] = useState(null);
    const [inboxes, setInboxes] = useState([]);
    const [inboxLabel, setInboxLabel] = useState('');
    const [inboxCreating, setInboxCreating] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('premium_user');
        if (stored) {
            try {
                const u = JSON.parse(stored);
                setUser(u);
                setAlias(u.custom_alias || '');
                setForwardTo(u.forward_to || '');
                setWebhookUrl(u.webhook_url || '');
                // Fetch inboxes
                if (u.email) {
                    api.get(`/premium/inboxes/${u.email}`).then(({ data }) => {
                        setInboxes(data.inboxes || []);
                    }).catch(() => { });
                }
            } catch { }
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
            await api.delete(`/premium/user/${user?.email}`).catch(() => { });
            localStorage.removeItem('premium_user');
            localStorage.removeItem('premium_email');
            if (onLogout) onLogout();
        } finally {
            setDeleteLoading(false);
        }
    };

    const saveAlias = async () => {
        setAliasSaving(true);
        setAliasMsg(null);
        try {
            const { data } = await api.post('/premium/alias', { email: user.email, alias });
            setAliasMsg({ type: 'success', text: data.address ? `Alias set: ${data.address}` : 'Alias removed' });
            const updated = { ...user, custom_alias: alias };
            setUser(updated);
            localStorage.setItem('premium_user', JSON.stringify(updated));
        } catch (err) {
            setAliasMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to save alias' });
        } finally {
            setAliasSaving(false);
        }
    };

    const saveForwarding = async () => {
        setForwardSaving(true);
        setForwardMsg(null);
        try {
            await api.post('/premium/forwarding', { email: user.email, forward_to: forwardTo });
            setForwardMsg({ type: 'success', text: forwardTo ? `Forwarding to ${forwardTo}` : 'Forwarding disabled' });
            const updated = { ...user, forward_to: forwardTo };
            setUser(updated);
            localStorage.setItem('premium_user', JSON.stringify(updated));
        } catch (err) {
            setForwardMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to save' });
        } finally {
            setForwardSaving(false);
        }
    };

    const saveWebhook = async () => {
        setWebhookSaving(true);
        setWebhookMsg(null);
        try {
            await api.post('/premium/webhook', { email: user.email, webhook_url: webhookUrl });
            setWebhookMsg({ type: 'success', text: webhookUrl ? 'Webhook configured' : 'Webhook disabled' });
            const updated = { ...user, webhook_url: webhookUrl };
            setUser(updated);
            localStorage.setItem('premium_user', JSON.stringify(updated));
        } catch (err) {
            setWebhookMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to save' });
        } finally {
            setWebhookSaving(false);
        }
    };

    const createInbox = async () => {
        if (inboxes.length >= 5) return;
        setInboxCreating(true);
        try {
            const { data } = await api.post('/premium/inboxes', { email: user.email, label: inboxLabel });
            setInboxes([{ address: data.address, label: data.label, created_at: new Date().toISOString() }, ...inboxes]);
            setInboxLabel('');
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to create inbox');
        } finally {
            setInboxCreating(false);
        }
    };

    const deleteInbox = async (address) => {
        try {
            await api.delete(`/premium/inboxes/${user.email}/${address}`);
            setInboxes(inboxes.filter(i => i.address !== address));
        } catch { }
    };

    const copyAddress = (address) => {
        navigator.clipboard.writeText(address);
    };

    const isPremium = user?.is_premium;

    // Not logged in
    if (!user) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-textMain">
                <div className="w-full max-w-md">
                    <button onClick={onBack} className="flex items-center gap-2 text-textMuted hover:text-textMain transition-colors mb-8 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Inbox</span>
                    </button>
                    <div className="dashboard-panel p-8 md:p-10 text-center">
                        <div className="mx-auto w-20 h-20 rounded-full bg-surfaceHover flex items-center justify-center mb-6">
                            <User className="w-10 h-10 text-textMuted" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">No Account</h2>
                        <p className="text-textMuted text-sm mb-6">Sign in or create a premium account to access your profile.</p>
                        <button onClick={onBack} className="btn-primary w-full py-3 rounded-lg text-sm font-bold">Go to Premium Sign In</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center p-4 pt-8 text-textMain">
            <div className="w-full max-w-lg">
                {/* Back button */}
                <button onClick={onBack} className="flex items-center gap-2 text-textMuted hover:text-textMain transition-colors mb-6 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Inbox</span>
                </button>

                {/* Profile Card */}
                <div className="dashboard-panel p-6 md:p-8 mb-5">
                    <div className="flex flex-col items-center mb-6">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 border-2 ${isPremium ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-surfaceHover border-border text-textMuted'}`}>
                            <User className="w-10 h-10" />
                        </div>
                        <h1 className="text-xl font-extrabold text-gray-900">{user.email?.split('@')[0] || 'User'}</h1>
                        <p className="text-textMuted text-sm">{user.email}</p>
                        {isPremium ? (
                            <div className="mt-2 flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                                <Crown className="w-3.5 h-3.5" /> Premium
                            </div>
                        ) : (
                            <div className="mt-2 flex items-center gap-1.5 bg-surfaceHover text-textMuted px-3 py-1 rounded-full text-xs font-bold">
                                <Shield className="w-3.5 h-3.5" /> Free
                            </div>
                        )}
                    </div>

                    {/* Account Info */}
                    <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-surfaceHover">
                            <span className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-textMuted" /> Email</span>
                            <span className="text-textMuted font-mono text-xs">{user.email}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-surfaceHover">
                            <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-textMuted" /> Member Since</span>
                            <span className="text-textMuted text-xs">{user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Premium Settings */}
                {isPremium && (
                    <div className="space-y-4 mb-5">
                        <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider">Premium Settings</h3>

                        {/* Custom Alias */}
                        <SettingRow icon={AtSign} label="Custom Alias" description="Set a custom email username (e.g. myname@vredobox.cc)">
                            <div className="flex gap-2">
                                <div className="flex-1 flex items-center bg-surface border border-border rounded-lg overflow-hidden">
                                    <input
                                        value={alias}
                                        onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                                        placeholder="myname"
                                        className="flex-1 px-3 py-2 text-sm bg-transparent outline-none text-textMain placeholder:text-textMuted"
                                    />
                                    <span className="text-xs text-textMuted pr-3 font-mono">@vredobox.cc</span>
                                </div>
                                <button onClick={saveAlias} disabled={aliasSaving} className="btn-primary px-3 py-2 text-xs font-bold rounded-lg">
                                    {aliasSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
                                </button>
                            </div>
                            {aliasMsg && <p className={`text-xs mt-2 font-medium ${aliasMsg.type === 'error' ? 'text-red-500' : 'text-primary'}`}>{aliasMsg.text}</p>}
                        </SettingRow>

                        {/* Email Forwarding */}
                        <SettingRow icon={Forward} label="Email Forwarding" description="Automatically forward incoming emails to your real address">
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={forwardTo}
                                    onChange={(e) => setForwardTo(e.target.value)}
                                    placeholder="your@email.com (leave empty to disable)"
                                    className="flex-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg outline-none text-textMain placeholder:text-textMuted focus:border-primary"
                                />
                                <button onClick={saveForwarding} disabled={forwardSaving} className="btn-primary px-3 py-2 text-xs font-bold rounded-lg">
                                    {forwardSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
                                </button>
                            </div>
                            {forwardMsg && <p className={`text-xs mt-2 font-medium ${forwardMsg.type === 'error' ? 'text-red-500' : 'text-primary'}`}>{forwardMsg.text}</p>}
                        </SettingRow>

                        {/* Webhook */}
                        <SettingRow icon={Webhook} label="Webhook Notifications" description="Receive an HTTP POST notification when new email arrives">
                            <div className="flex gap-2">
                                <input
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                    placeholder="https://your-api.com/webhook (leave empty to disable)"
                                    className="flex-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg outline-none text-textMain placeholder:text-textMuted focus:border-primary"
                                />
                                <button onClick={saveWebhook} disabled={webhookSaving} className="btn-primary px-3 py-2 text-xs font-bold rounded-lg">
                                    {webhookSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
                                </button>
                            </div>
                            {webhookMsg && <p className={`text-xs mt-2 font-medium ${webhookMsg.type === 'error' ? 'text-red-500' : 'text-primary'}`}>{webhookMsg.text}</p>}
                        </SettingRow>

                        {/* Multiple Inboxes */}
                        <SettingRow icon={Inbox} label="Multiple Inboxes" description={`Manage up to 5 active inboxes (${inboxes.length}/5 used)`}>
                            <div className="space-y-2">
                                {inboxes.map((inbox) => (
                                    <div key={inbox.address} className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border text-sm">
                                        <div className="flex-1 min-w-0 mr-2">
                                            <p className="font-mono text-xs text-textMain truncate">{inbox.address}</p>
                                            <p className="text-xs text-textMuted">{inbox.label}</p>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button onClick={() => copyAddress(inbox.address)} className="p-1.5 text-textMuted hover:text-primary rounded" title="Copy">
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => deleteInbox(inbox.address)} className="p-1.5 text-textMuted hover:text-red-500 rounded" title="Remove">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {inboxes.length < 5 && (
                                    <div className="flex gap-2">
                                        <input
                                            value={inboxLabel}
                                            onChange={(e) => setInboxLabel(e.target.value)}
                                            placeholder="Label (optional)"
                                            className="flex-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg outline-none text-textMain placeholder:text-textMuted focus:border-primary"
                                        />
                                        <button onClick={createInbox} disabled={inboxCreating} className="btn-primary px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1">
                                            {inboxCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5" /> Add</>}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </SettingRow>
                    </div>
                )}

                {/* Upgrade (non-premium) */}
                {!isPremium && (
                    <div className="dashboard-panel p-5 mb-5 border-primary/20">
                        <div className="flex items-start gap-3">
                            <div className="bg-primary/10 p-2 rounded-xl flex-shrink-0">
                                <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 text-sm mb-1">Upgrade to Premium</h3>
                                <p className="text-xs text-textMuted mb-3">Custom aliases, forwarding, attachments, reply, webhooks, and more — $4.99/mo</p>
                                <button className="btn-primary text-xs px-4 py-2 rounded-lg font-bold">Upgrade Now</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-2 mb-6">
                    <button onClick={handleLogout} className="w-full flex items-center justify-between p-3.5 rounded-xl bg-surface border border-border hover:bg-surfaceHover transition-colors group">
                        <span className="flex items-center gap-3 text-sm font-semibold"><LogOut className="w-4 h-4 text-textMuted" /> Log Out</span>
                        <ChevronRight className="w-4 h-4 text-textMuted group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center justify-between p-3.5 rounded-xl bg-surface border border-red-200 hover:bg-red-50 transition-colors group">
                        <span className="flex items-center gap-3 text-sm font-semibold text-red-600"><Trash2 className="w-4 h-4 text-red-500" /> Delete Account</span>
                        <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                {/* Delete Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="dashboard-panel p-8 max-w-sm w-full text-center">
                            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                                <AlertTriangle className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Delete Account?</h3>
                            <p className="text-textMuted text-sm mb-6">This cannot be undone. All data will be permanently removed.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-lg border border-border text-sm font-bold text-textMain hover:bg-surfaceHover">Cancel</button>
                                <button onClick={handleDeleteAccount} disabled={deleteLoading} className="flex-1 py-3 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600">
                                    {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="text-center text-textMuted/50 text-xs mb-4 font-medium">TempyMail © 2026</div>
            </div>
        </div>
    );
}
