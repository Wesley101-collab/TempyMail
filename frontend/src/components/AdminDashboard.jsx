import React, { useState, useEffect } from 'react';
import { BarChart3, Mail, Users, TrendingUp, ArrowLeft, Lock, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function AdminDashboard({ onBack }) {
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

    return (
        <div className="min-h-screen bg-background p-6 text-textMain">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="btn-ghost p-2 hover:bg-surfaceHover border border-transparent rounded-lg">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
                    </div>
                    <button onClick={refreshStats} disabled={loading} className="btn-secondary px-4 py-2 gap-2 text-sm">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard icon={<Mail className="w-5 h-5" />} label="Emails Today" value={stats?.emailsToday || 0} />
                    <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Total Emails" value={stats?.totalEmails || 0} />
                    <StatCard icon={<Users className="w-5 h-5" />} label="Accounts Today" value={stats?.accountsToday || 0} />
                    <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Total Accounts" value={stats?.totalAccounts || 0} />
                </div>

                {/* Hourly Chart */}
                <div className="dashboard-panel p-6 mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 tracking-tight">Emails — Last 24 Hours</h3>
                    {stats?.hourlyChart?.length > 0 ? (
                        <div className="flex items-end gap-1.5 h-48 overflow-x-auto hide-scrollbar pt-4">
                            {stats.hourlyChart.map((item, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 flex-1 min-w-[28px] group" title={`${item.hour}: ${item.count} emails`}>
                                    <span className="text-xs text-textMuted font-medium opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">{item.count}</span>
                                    <div
                                        className="w-full bg-green-200 rounded-t-sm min-h-[4px] transition-all group-hover:bg-primary"
                                        style={{ height: `${(item.count / maxChartValue) * 140}px` }}
                                    />
                                    <span className="text-[10px] text-textMuted font-medium truncate w-full text-center mt-1 uppercase">
                                        {item.hour?.split(' ')[1] || ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-textMuted text-sm">No email data in the last 24 hours.</p>
                    )}
                </div>

                {/* Recent Emails Table */}
                <div className="dashboard-panel overflow-hidden">
                    <div className="p-6 border-b border-border bg-surface">
                        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Recent Emails</h3>
                    </div>
                    {recentEmails.length > 0 ? (
                        <div className="overflow-x-auto">
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
                                            <td className="py-4 px-6 text-textMuted truncate max-w-[300px]">{email.subject}</td>
                                            <td className="py-4 px-6 text-textMuted text-xs text-right">{new Date(email.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6">
                            <p className="text-textMuted text-sm">No emails received yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }) {
    return (
        <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-4">
                <p className="text-textMuted text-sm font-bold uppercase tracking-wider">{label}</p>
                <div className="p-2 bg-green-50 rounded-lg text-primary border border-green-100">{icon}</div>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{value.toLocaleString()}</p>
        </div>
    );
}
