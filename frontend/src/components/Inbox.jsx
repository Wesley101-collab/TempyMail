import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Inbox as InboxIcon, RefreshCcw, Loader2, Download, Paperclip } from 'lucide-react';
import { api } from '../services/api';

export default function Inbox({ messages, selectedId, onSelect, loading, currentAddress }) {
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
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                        <RefreshCcw className="w-10 h-10 mb-4 text-border animate-spin-slow" style={{ animationDuration: '3s' }} />
                        <p className="font-semibold text-textMain text-lg mb-1">Your inbox is empty</p>
                        <p className="text-sm text-textMuted">Waiting for incoming emails...<br />Auto-refreshing every 2s.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {messages.map((msg) => (
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
