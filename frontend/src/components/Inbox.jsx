import React, { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Inbox as InboxIcon, RefreshCcw, Loader2, Download, Paperclip, Search, X } from 'lucide-react';
import { api } from '../services/api';

export default function Inbox({ messages, selectedId, onSelect, loading, currentAddress }) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredMessages = useMemo(() => {
        if (!searchQuery.trim()) return messages;
        const q = searchQuery.toLowerCase();
        return messages.filter(msg =>
            (msg.from?.name || '').toLowerCase().includes(q) ||
            (msg.from?.address || '').toLowerCase().includes(q) ||
            (msg.subject || '').toLowerCase().includes(q) ||
            (msg.intro || '').toLowerCase().includes(q)
        );
    }, [messages, searchQuery]);

    const handleDownloadAll = () => {
        if (!currentAddress || messages.length === 0) return;
        const url = `${api.defaults.baseURL}/messages/download?address=${encodeURIComponent(currentAddress)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 dashboard-panel overflow-y-auto hide-scrollbar flex flex-col">
                <div className="px-5 py-4 flex items-center gap-2 text-textMain font-bold text-lg border-b border-border sticky top-0 bg-surface z-10">
                    <InboxIcon className="w-5 h-5 text-primary" />
                    <h2>Inbox</h2>
                    <span className="bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full ml-1 font-bold">
                        {messages.length}
                    </span>
                    {loading && <Loader2 className="w-4 h-4 text-primary animate-spin ml-2" />}
                    {messages.length > 0 && (
                        <button
                            onClick={handleDownloadAll}
                            className="ml-auto p-1.5 text-textMuted hover:text-primary hover:bg-surfaceHover rounded-lg transition-colors"
                            title="Download all as .zip"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                {messages.length > 0 && (
                    <div className="px-3 py-2 border-b border-border sticky top-[60px] bg-surface z-10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textMuted pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by sender, subject..."
                                className="w-full bg-surfaceHover border border-border rounded-lg py-1.5 pl-8 pr-8 text-xs text-textMain placeholder:text-textMuted outline-none focus:border-primary transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-textMuted hover:text-textMain transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                        <RefreshCcw className="w-10 h-10 mb-4 text-border animate-spin-slow" style={{ animationDuration: '3s' }} />
                        <p className="font-semibold text-textMain text-lg mb-1">Your inbox is empty</p>
                        <p className="text-sm text-textMuted">Waiting for incoming emails...<br />Auto-refreshing every 2s.</p>
                    </div>
                ) : filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                        <Search className="w-8 h-8 mb-3 text-textMuted" />
                        <p className="font-semibold text-textMain text-sm mb-1">No matching emails</p>
                        <p className="text-xs text-textMuted">Try a different search term.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {filteredMessages.map((msg) => (
                            <div
                                key={msg.id}
                                onClick={() => onSelect(msg.id)}
                                className={`px-5 py-4 cursor-pointer transition-all ${selectedId === msg.id
                                    ? 'bg-primary/5 border-l-4 border-l-primary'
                                    : 'hover:bg-surfaceHover border-l-4 border-l-transparent'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {!msg.seen && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>}
                                        <span className="font-bold text-sm text-textMain truncate">
                                            {msg.from?.name || msg.from?.address?.split('@')[0] || 'Unknown'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-textMuted ml-3 flex-shrink-0">
                                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className={`text-sm truncate ${!msg.seen ? 'font-semibold text-textMain' : 'text-textMain'}`}>
                                    {msg.subject || '(No Subject)'}
                                </p>
                                <p className="text-xs text-textMuted truncate mt-1">
                                    {msg.intro || msg.from?.address}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
