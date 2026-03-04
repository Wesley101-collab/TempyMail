import React, { useState, useEffect } from 'react';
import { BarChart3, Mail, Users, TrendingUp, ArrowLeft, Lock, Loader2, RefreshCw, Activity, Inbox, Clock, Globe } from 'lucide-react';
import { api } from '../services/api';

export default function AdminDashboard({ onBack }) {
    const [adminKey, setAdminKey] = useState('');
    const [authenticated, setAuthenticated] = useState(false);
    const [stats, setStats] = useState(null);
    const [recentEmails, setRecentEmails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);

    const login = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get('/admin/stats', {
                headers: { 'X-Admin-Key': adminKey }
            });
            setStats(data);
            setAuthenticated(true);
            setLastRefresh(new Date());
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
            setLastRefresh(new Date());
        } catch (err) {
            console.error('Failed to refresh stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const savedKey = localStorage.getItem('admin_key');
        if (savedKey) {
            setAdminKey(savedKey);
            api.get('/admin/stats', { headers: { 'X-Admin-Key': savedKey } })
                .then(res => {
                    setStats(res.data);
                    setAuthenticated(true);
                    setLastRefresh(new Date());
                    return api.get('/admin/recent', { headers: { 'X-Admin-Key': savedKey } });
                })
                .then(res => setRecentEmails(res.data.emails || []))
                .catch(() => localStorage.removeItem('admin_key'));
        }
    }, []);

    useEffect(() => {
        if (!authenticated) return;
        const interval = setInterval(refreshStats, 15000);
        return () => clearInterval(interval);
    }, [authenticated]);

    if (!authenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background text-textMain">
                <div className="dashboard-panel p-10 max-w-md w-full text-center">
                    <div className="p-4 bg-green-50 rounded-xl w-fit mx-auto mb-6 border border-green-100">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Admin Access</h2>
                    <p className="text-textMuted mb-8 text-sm">Enter your admin key to view analytics.</p>
                    <input
                        type="password"
                        value={adminKey}
                        onChange={(e) => setAdminKey(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && login()}
                        placeholder="Admin key..."
                        className="w-full py-3 px-4 rounded-lg bg-surfaceHover border border-border text-textMain mb-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors shadow-sm"
                    />
                    {error && <p className="text-red-600 text-sm mb-4 font-medium">{error}</p>}
                    <button onClick={login} disabled={loading || !adminKey} className="btn-primary w-full py-3 shadow-md hover:-translate-y-0.5 transition-all text-sm gap-2 disabled:opacity-50 disabled:hover:translate-y-0">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Sign In
                    </button>
                    <button onClick={onBack} className="text-textMuted text-sm mt-6 hover:text-primary transition-colors flex items-center gap-1.5 mx-auto font-medium">
                        <ArrowLeft className="w-4 h-4" /> Back to App
                    </button>
                </div>
            </div>
        );
    }

    const maxChartValue = Math.max(...(stats?.hourlyChart?.map(h => h.count) || [1]), 1);
    const emailRate = stats?.totalAccounts > 0 ? (stats.totalEmails / stats.totalAccounts).toFixed(1) : '0';

    return (
        <div className="min-h-screen bg-background p-3 sm:p-6 text-textMain">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="btn-ghost p-2 hover:bg-surfaceHover border border-transparent rounded-lg">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Analytics Dashboard</h1>
                            {lastRefresh && (
                                <p className="text-xs text-textMuted mt-0.5">
                                    Last updated: {lastRefresh.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs font-semibold text-green-700">Live</span>
                        </div>
                        <button onClick={refreshStats} disabled={loading} className="btn-secondary px-4 py-2 gap-2 text-sm ml-auto sm:ml-0">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                    </div>
                </div>

                {/* Stat Cards - 2x2 on mobile, 4 cols on desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <StatCard
                        icon={<Mail className="w-5 h-5" />}
                        label="Emails Today"
                        value={stats?.emailsToday || 0}
                        color="blue"
                    />
                    <StatCard
                        icon={<TrendingUp className="w-5 h-5" />}
                        label="Total Emails"
                        value={stats?.totalEmails || 0}
                        color="green"
                    />
                    <StatCard
                        icon={<Users className="w-5 h-5" />}
                        label="Accounts Today"
                        value={stats?.accountsToday || 0}
                        color="purple"
                    />
                    <StatCard
                        icon={<Globe className="w-5 h-5" />}
                        label="Total Accounts"
                        value={stats?.totalAccounts || 0}
                        color="orange"
                    />
                </div>

                {/* Secondary Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
                    <div className="dashboard-card p-4 sm:p-5 flex items-center gap-4">
                        <div className="p-2.5 bg-teal-50 rounded-lg text-teal-600 border border-teal-100">
                            <Inbox className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-textMuted font-semibold uppercase tracking-wider">Unique Mailboxes</p>
                            <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{(stats?.uniqueRecipients || 0).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="dashboard-card p-4 sm:p-5 flex items-center gap-4">
                        <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-textMuted font-semibold uppercase tracking-wider">Emails / Account</p>
                            <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{emailRate}</p>
                        </div>
                    </div>
                    <div className="dashboard-card p-4 sm:p-5 flex items-center gap-4 col-span-2 lg:col-span-1">
                        <div className="p-2.5 bg-rose-50 rounded-lg text-rose-500 border border-rose-100">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-textMuted font-semibold uppercase tracking-wider">Hourly Rate</p>
                            <p className="text-xl sm:text-2xl font-extrabold text-gray-900">
                                {stats?.hourlyChart?.length > 0
                                    ? (stats.hourlyChart.reduce((sum, h) => sum + h.count, 0) / Math.max(stats.hourlyChart.length, 1)).toFixed(1)
                                    : '0'
                                }
                                <span className="text-sm font-medium text-textMuted ml-1">/ hr</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Hourly Chart */}
                <div className="dashboard-panel p-4 sm:p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Email Activity — Last 24 Hours</h3>
                        <span className="text-xs text-textMuted bg-surfaceHover px-2 py-1 rounded-md font-medium">
                            {stats?.hourlyChart?.reduce((s, h) => s + h.count, 0) || 0} total
                        </span>
                    </div>
                    {stats?.hourlyChart?.length > 0 ? (
                        <div className="flex items-end gap-1 h-40 sm:h-48 overflow-x-auto hide-scrollbar pt-4">
                            {stats.hourlyChart.map((item, i) => {
                                const pct = (item.count / maxChartValue) * 100;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-[20px] sm:min-w-[28px] group cursor-pointer" title={`${item.hour}: ${item.count} emails`}>
                                        <span className="text-[10px] text-textMuted font-bold opacity-0 group-hover:opacity-100 transition-opacity">{item.count}</span>
                                        <div
                                            className="w-full rounded-t-sm min-h-[4px] transition-all duration-300 group-hover:opacity-80"
                                            style={{
                                                height: `${Math.max(pct, 3)}%`,
                                                background: pct > 60
                                                    ? 'linear-gradient(to top, #16A34A, #22C55E)'
                                                    : pct > 30
                                                        ? 'linear-gradient(to top, #22C55E, #4ADE80)'
                                                        : '#BBF7D0'
                                            }}
                                        />
                                        <span className="text-[9px] sm:text-[10px] text-textMuted font-medium truncate w-full text-center uppercase">
                                            {item.hour?.split(' ')[1]?.replace(':00', 'h') || ''}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center">
                            <p className="text-textMuted text-sm">No email activity in the last 24 hours.</p>
                        </div>
                    )}
                </div>

                {/* Recent Emails Table */}
                <div className="dashboard-panel overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-border bg-surface flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Recent Emails</h3>
                        <span className="text-xs bg-surfaceHover px-2 py-1 rounded-md text-textMuted font-medium">
                            {recentEmails.length} shown
                        </span>
                    </div>

                    {/* Mobile: Card view */}
                    <div className="block sm:hidden divide-y divide-border">
                        {recentEmails.length > 0 ? recentEmails.map((email) => (
                            <div key={email.id} className="p-4 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-primary font-medium text-xs truncate max-w-[200px]">{email.recipient}</span>
                                    <span className="text-[10px] text-textMuted">{new Date(email.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-sm text-textMain font-medium truncate">{email.subject || '(no subject)'}</p>
                                <p className="text-xs text-textMuted truncate">From: {email.sender}</p>
                            </div>
                        )) : (
                            <div className="p-6 text-center">
                                <p className="text-textMuted text-sm">No emails received yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Desktop: Table view */}
                    {recentEmails.length > 0 ? (
                        <div className="overflow-x-auto hidden sm:block">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-surfaceHover/50">
                                    <tr>
                                        <th className="py-3 px-6 text-textMuted font-bold uppercase tracking-wider text-xs">Recipient</th>
                                        <th className="py-3 px-6 text-textMuted font-bold uppercase tracking-wider text-xs">From</th>
                                        <th className="py-3 px-6 text-textMuted font-bold uppercase tracking-wider text-xs w-full">Subject</th>
                                        <th className="py-3 px-6 text-textMuted font-bold uppercase tracking-wider text-xs text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {recentEmails.map((email) => (
                                        <tr key={email.id} className="hover:bg-surfaceHover/30 transition-colors">
                                            <td className="py-4 px-6 font-mono text-primary font-medium text-xs truncate max-w-[200px]">{email.recipient}</td>
                                            <td className="py-4 px-6 text-textMain font-medium truncate max-w-[200px]">{email.sender}</td>
                                            <td className="py-4 px-6 text-textMuted truncate max-w-[300px]">{email.subject || '(no subject)'}</td>
                                            <td className="py-4 px-6 text-textMuted text-xs text-right">{new Date(email.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6 hidden sm:block">
                            <p className="text-textMuted text-sm">No emails received yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color = 'green' }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-500 border-blue-100',
        green: 'bg-green-50 text-green-600 border-green-100',
        purple: 'bg-purple-50 text-purple-500 border-purple-100',
        orange: 'bg-orange-50 text-orange-500 border-orange-100',
    };
    return (
        <div className="dashboard-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
                <p className="text-textMuted text-xs font-bold uppercase tracking-wider">{label}</p>
                <div className={`p-1.5 sm:p-2 ${colors[color]} rounded-lg border`}>{icon}</div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
        </div>
    );
}
