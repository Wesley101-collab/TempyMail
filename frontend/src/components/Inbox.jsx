import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Inbox as InboxIcon, RefreshCcw, Loader2 } from 'lucide-react';

export default function Inbox({ messages, selectedId, onSelect, loading }) {
    return (
        <div className="glass-panel h-full flex flex-col overflow-hidden max-h-[800px]">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-surface/50">
                <div className="flex items-center gap-3 text-primary font-semibold">
                    <InboxIcon className="w-5 h-5 text-secondary" />
                    <h2 className="tracking-wide">Inbox</h2>
                    <span className="bg-primary/20 text-primary text-xs px-2.5 py-1 rounded-full ml-1 font-bold font-mono">
                        {messages.length}
                    </span>
                </div>
                {loading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-2">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-60 p-6 text-center">
                        <RefreshCcw className="w-12 h-12 mb-5 text-secondary animate-spin-slow" style={{ animationDuration: '3s' }} />
                        <p className="font-medium text-lg">Waiting for incoming emails...</p>
                        <p className="text-sm mt-2 opacity-75">Auto-refreshing every 2 seconds</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            onClick={() => onSelect(msg.id)}
                            className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${selectedId === msg.id
                                ? 'bg-primary/20 border-primary/50 shadow-[0_0_15px_rgba(102,252,241,0.15)] scale-[1.02]'
                                : 'bg-surface-hover border-white/5 hover:border-primary/30 hover:bg-surface/80'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`font-semibold text-text-main truncate pr-3 flex-1 ${!msg.seen ? 'text-primary font-bold' : ''}`}>
                                    {msg.from.address}
                                </span>
                                <span className="text-xs text-secondary whitespace-nowrap pt-1 font-medium bg-primary/10 px-2 py-0.5 rounded-md">
                                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                            <p className={`text-sm text-text-main truncate mb-1 ${!msg.seen ? 'font-semibold' : ''}`}>
                                {msg.subject || '(No Subject)'}
                            </p>
                            <p className="text-xs text-text-muted truncate leading-relaxed">
                                {msg.intro}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
