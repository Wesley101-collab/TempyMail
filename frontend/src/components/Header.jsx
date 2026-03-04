import React, { useState } from 'react';
import { Mail, Copy, RefreshCw, Check, Bell, Search, History, ChevronRight, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Header({ account, generateAccount, refreshInbox, onLogoClick, history = [], recoverAccount }) {
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
        <header className="bg-surface border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-50">
            {/* Left: Logo */}
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={onLogoClick}>
                <div className="bg-primary p-1.5 rounded-lg">
                    <Mail className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-textMain tracking-tight">
                    TempyMail
                </h1>
            </div>

            {/* Middle: Search bar (Used to display current email in this app context) */}
            <div className="hidden md:flex flex-1 max-w-lg mx-6">
                <div className="relative w-full flex items-center">
                    <div className="absolute left-3 text-textMuted">
                        <Search className="w-4 h-4" />
                    </div>
                    <div className="w-full bg-surfaceHover border border-border rounded-lg py-2 pl-10 pr-12 text-sm text-textMain font-mono font-medium truncate">
                        {account?.address || 'Generating address...'}
                    </div>
                    <button
                        onClick={handleCopy}
                        className="absolute right-2 p-1.5 text-textMuted hover:text-primary bg-surfaceHover hover:bg-surface rounded-md transition-colors"
                        title="Copy Email"
                    >
                        {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Right: Actions & User */}
            <div className="flex items-center gap-3 lg:gap-4">
                {/* Mobile Copy Button (since search bar is hidden) */}
                <button
                    onClick={handleCopy}
                    className="md:hidden btn-ghost p-2"
                    title="Copy Email"
                >
                    {copied ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
                </button>

                <button
                    onClick={generateAccount}
                    className="hidden sm:flex btn-ghost text-sm px-3 py-2 gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden lg:inline">Change Email</span>
                </button>

                {/* History Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`btn-ghost p-2 transition-colors ${showHistory ? 'bg-surfaceHover text-primary' : ''}`}
                        title="Session History"
                    >
                        <History className="w-5 h-5" />
                    </button>

                    {showHistory && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowHistory(false)}></div>
                            <div className="absolute right-0 top-full mt-2 w-80 dashboard-panel shadow-lg z-50 overflow-hidden text-left origin-top-right">
                                <div className="p-4 border-b border-border bg-surfaceHover/50">
                                    <h3 className="font-bold text-textMain flex items-center gap-2 text-sm">
                                        <History className="w-4 h-4 text-primary" /> Recent Inboxes
                                    </h3>
                                    <p className="text-xs text-textMuted mt-1">Recover past sessions within 24h.</p>
                                </div>
                                <div className="max-h-64 overflow-y-auto hide-scrollbar p-2">
                                    {history.length === 0 ? (
                                        <div className="p-4 text-center text-textMuted text-sm">
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
                                                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${isActive
                                                        ? 'bg-primary/10 border border-primary/20 cursor-default'
                                                        : 'hover:bg-surfaceHover border border-transparent'
                                                        }`}
                                                >
                                                    <div className="overflow-hidden pr-2">
                                                        <p className={`font-mono font-medium text-sm truncate ${isActive ? 'text-primary' : 'text-textMain'}`}>
                                                            {item.address}
                                                        </p>
                                                        <p className="text-xs text-textMuted mt-1">
                                                            {isActive ? 'Current Session' : formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                    {!isActive && <ChevronRight className="w-4 h-4 text-textMuted" />}
                                                </button>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Notifications Bell (from ref image) */}
                <button className="btn-ghost p-2 relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-surface"></span>
                </button>

                {/* User Avatar (from ref image) */}
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/30 ml-2">
                    <User className="w-4 h-4" />
                </div>
            </div>
        </header>
    );
}
