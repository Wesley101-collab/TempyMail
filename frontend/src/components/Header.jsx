import React, { useState } from 'react';
import { Mail, Copy, RefreshCw, Check, RotateCcw, Sun, Moon, History, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Header({ account, generateAccount, refreshInbox, onLogoClick, theme, toggleTheme, history = [], recoverAccount }) {
    const [copied, setCopied] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const handleCopy = () => {
        if (account?.address) {
            navigator.clipboard.writeText(account.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <header className="glass-panel w-full p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
                <button onClick={onLogoClick} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="p-2 bg-primary/20 rounded-xl shadow-[0_0_15px_rgba(102,252,241,0.2)]">
                        <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary text-glow">
                        TempyMail
                    </h1>
                </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                {/* Email display + copy */}
                <div className="glass-card px-4 py-3 flex items-center justify-between min-w-[300px] w-full sm:w-auto">
                    <span className="text-text-main font-mono font-medium truncate mr-4">
                        {account?.address || 'Generating address...'}
                    </span>
                    <button
                        onClick={handleCopy}
                        className="text-text-muted hover:text-primary transition-colors focus:outline-none"
                        title="Copy Email"
                    >
                        {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                </div>

                {/* Refresh Inbox button */}
                <button
                    onClick={refreshInbox}
                    className="glass-button px-5 py-3 w-full sm:w-auto font-semibold gap-2"
                    title="Refresh Inbox"
                >
                    <RotateCcw className="w-5 h-5" />
                    <span>Refresh</span>
                </button>

                {/* Change Email button */}
                <button
                    onClick={generateAccount}
                    className="bg-primary/10 hover:bg-primary/20 text-text-main border border-primary/20 transition-all duration-300 rounded-lg px-5 py-3 w-full sm:w-auto font-semibold gap-2 flex items-center justify-center hover:shadow-[0_0_10px_rgba(102,252,241,0.1)] active:scale-95"
                >
                    <RefreshCw className="w-5 h-5" />
                    <span>Change Email</span>
                </button>

                {/* Theme Toggle button */}
                <button
                    onClick={toggleTheme}
                    className="glass-button p-3 aspect-square sm:w-auto font-semibold"
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
                </button>

                {/* History Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`glass-button p-3 aspect-square sm:w-auto font-semibold transition-all ${showHistory ? 'bg-primary/20 border-primary/40 text-primary shadow-[0_0_15px_rgba(102,252,241,0.2)]' : ''}`}
                        title="Session History"
                    >
                        <History className="w-5 h-5" />
                    </button>

                    {showHistory && (
                        <>
                            {/* Backdrop */}
                            <div className="fixed inset-0 z-40" onClick={() => setShowHistory(false)}></div>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full mt-2 w-80 glass-panel border border-white/10 shadow-2xl z-50 overflow-hidden transform origin-top-right animate-in fade-in slide-in-from-top-2">
                                <div className="p-4 border-b border-white/10 bg-surface/50">
                                    <h3 className="font-bold text-text-main flex items-center gap-2">
                                        <History className="w-4 h-4 text-primary" /> Recent Inboxes
                                    </h3>
                                    <p className="text-xs text-text-muted mt-1 leading-relaxed">Recover up to 5 previously generated email sessions within the last 24 hours.</p>
                                </div>
                                <div className="max-h-64 overflow-y-auto hide-scrollbar p-2">
                                    {history.length === 0 ? (
                                        <div className="p-4 text-center text-text-muted text-sm">
                                            No recent inboxes found.
                                        </div>
                                    ) : (
                                        history.map((item) => {
                                            const isActive = item.address === account?.address;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => {
                                                        if (!isActive) {
                                                            recoverAccount(item.address);
                                                            setShowHistory(false);
                                                        }
                                                    }}
                                                    disabled={isActive}
                                                    className={`w-full text-left p-3 rounded-xl mb-1 flex items-center justify-between transition-all ${isActive
                                                        ? 'bg-primary/10 border border-primary/20 cursor-default'
                                                        : 'hover:bg-surface border border-transparent hover:border-white/5 group'
                                                        }`}
                                                >
                                                    <div className="overflow-hidden pr-3">
                                                        <p className={`font-mono font-bold text-sm truncate ${isActive ? 'text-primary' : 'text-text-main group-hover:text-primary transition-colors'}`}>
                                                            {item.address}
                                                        </p>
                                                        <p className="text-xs text-text-muted font-medium mt-1">
                                                            {isActive ? 'Current Session' : formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                    {!isActive && <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors flex-shrink-0" />}
                                                </button>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
