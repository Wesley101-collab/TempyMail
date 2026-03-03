import React, { useState, useEffect } from 'react';
import { BarChart3, Mail, Users, TrendingUp, ArrowLeft, Lock, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function AdminDashboard({ onBack, theme }) {
    const [adminKey, setAdminKey] = useState('');
    const [authenticated, setAuthenticated] = useState(false);
    const [stats, setStats] = useState(null);
    const [recentEmails, setRecentEmails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get('/admin/stats', {
                headers: { 'X-Admin-Key': adminKey }
            });
            setStats(data);
            setAuthenticated(true);
            localStorage.setItem('admin_key', adminKey);

            const recent = await api.get('/admin/recent', {
                headers: { 'X-Admin-Key': adminKey }
            });
            setRecentEmails(recent.data.emails || []);
        } catch (err) {
            setError('Invalid admin key. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const refreshStats = async () => {
        const key = localStorage.getItem('admin_key') || adminKey;
        setLoading(true);
        try {
            const [statsRes, recentRes] = await Promise.all([
                api.get('/admin/stats', { headers: { 'X-Admin-Key': key } }),
                api.get('/admin/recent', { headers: { 'X-Admin-Key': key } })
            ]);
            setStats(statsRes.data);
            setRecentEmails(recentRes.data.emails || []);
        } catch (err) {
            console.error('Failed to refresh stats');
        } finally {
            setLoading(false);
        }
    };

    // Auto-login if key is saved
    useEffect(() => {
        const savedKey = localStorage.getItem('admin_key');
        if (savedKey) {
            setAdminKey(savedKey);
            api.get('/admin/stats', { headers: { 'X-Admin-Key': savedKey } })
                .then(res => {
                    setStats(res.data);
                    setAuthenticated(true);
                    return api.get('/admin/recent', { headers: { 'X-Admin-Key': savedKey } });
                })
                .then(res => setRecentEmails(res.data.emails || []))
                .catch(() => localStorage.removeItem('admin_key'));
        }
    }, []);

    // Auto-refresh every 10 seconds
    useEffect(() => {
        if (!authenticated) return;
        const interval = setInterval(refreshStats, 10000);
        return () => clearInterval(interval);
    }, [authenticated]);

    if (!authenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 app-bg">
                <div className="glass-panel p-10 max-w-md w-full text-center">
                    <div className="p-4 bg-primary/20 rounded-2xl w-fit mx-auto mb-6">
                        <Lock className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-main mb-2">Admin Access</h2>
                    <p className="text-text-muted mb-6 text-sm">Enter your admin key to view analytics.</p>
                    <input
                        type="password"
                        value={adminKey}
                        onChange={(e) => setAdminKey(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && login()}
                        placeholder="Admin key..."
                        className="w-full py-3 px-4 rounded-lg bg-surface-hover border border-border text-text-main mb-4 outline-none focus:border-primary transition-colors"
                    />
                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                    <button onClick={login} disabled={loading || !adminKey} className="glass-button w-full py-3 font-bold gap-2 disabled:opacity-50">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                        Sign In
                    </button>
                    <button onClick={onBack} className="text-text-muted text-sm mt-4 hover:text-primary transition-colors flex items-center gap-1 mx-auto">
                        <ArrowLeft className="w-4 h-4" /> Back to app
                    </button>
                </div>
            </div>
        );
    }

    const maxChartValue = Math.max(...(stats?.hourlyChart?.map(h => h.count) || [1]), 1);

    return (
        <div className="min-h-screen app-bg p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="glass-button p-2">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-text-main">Admin Dashboard</h1>
                    </div>
                    <button onClick={refreshStats} disabled={loading} className="glass-button px-4 py-2 gap-2 text-sm font-semibold">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard icon={<Mail className="w-6 h-6" />} label="Emails Today" value={stats?.emailsToday || 0} />
                    <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Total Emails" value={stats?.totalEmails || 0} />
                    <StatCard icon={<Users className="w-6 h-6" />} label="Accounts Today" value={stats?.accountsToday || 0} />
                    <StatCard icon={<BarChart3 className="w-6 h-6" />} label="Total Accounts" value={stats?.totalAccounts || 0} />
                </div>

                {/* Hourly Chart */}
                <div className="glass-panel p-6 mb-8">
                    <h3 className="text-lg font-bold text-text-main mb-4">Emails — Last 24 Hours</h3>
                    {stats?.hourlyChart?.length > 0 ? (
                        <div className="flex items-end gap-1 h-40 overflow-x-auto hide-scrollbar">
                            {stats.hourlyChart.map((item, i) => (
                                <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-[24px]" title={`${item.hour}: ${item.count} emails`}>
                                    <span className="text-xs text-text-muted font-mono">{item.count}</span>
                                    <div
                                        className="w-full bg-primary/60 rounded-t-md min-h-[4px] transition-all hover:bg-primary"
                                        style={{ height: `${(item.count / maxChartValue) * 120}px` }}
                                    />
                                    <span className="text-xs text-text-muted/60 font-mono truncate w-full text-center">
                                        {item.hour?.split(' ')[1] || ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-text-muted text-sm">No email data in the last 24 hours.</p>
                    )}
                </div>

                {/* Recent Emails Table */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-text-main mb-4">Recent Emails</h3>
                    {recentEmails.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="py-3 px-2 text-text-muted font-semibold">Recipient</th>
                                        <th className="py-3 px-2 text-text-muted font-semibold">From</th>
                                        <th className="py-3 px-2 text-text-muted font-semibold">Subject</th>
                                        <th className="py-3 px-2 text-text-muted font-semibold">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentEmails.map((email) => (
                                        <tr key={email.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                                            <td className="py-3 px-2 font-mono text-primary text-xs truncate max-w-[200px]">{email.recipient}</td>
                                            <td className="py-3 px-2 text-text-main truncate max-w-[200px]">{email.sender}</td>
                                            <td className="py-3 px-2 text-text-muted truncate max-w-[250px]">{email.subject}</td>
                                            <td className="py-3 px-2 text-text-muted/70 text-xs whitespace-nowrap">{new Date(email.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-text-muted text-sm">No emails received yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }) {
    return (
        <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">{icon}</div>
            </div>
            <p className="text-3xl font-extrabold text-text-main">{value.toLocaleString()}</p>
            <p className="text-text-muted text-sm font-medium mt-1">{label}</p>
        </div>
    );
}
