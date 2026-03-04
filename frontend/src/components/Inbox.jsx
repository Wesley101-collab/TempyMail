import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Mail, Calendar, RefreshCcw, Loader2 } from 'lucide-react';

export default function Inbox({ messages, selectedId, onSelect, loading }) {
    return (
        <div className="h-full flex flex-col">
            <div className="mb-4 flex items-center gap-2 text-textMain font-bold text-lg">
                <Calendar className="w-5 h-5 text-primary" />
                <h2>Inbox Messages</h2>
                <span className="bg-surfaceHover text-textMuted text-xs px-2 py-0.5 rounded-full ml-2 font-medium">
                    {messages.length}
                </span>
                {loading && <Loader2 className="w-4 h-4 text-primary animate-spin ml-2" />}
            </div>

            <div className="flex-1 dashboard-panel overflow-y-auto hide-scrollbar">
                {/* Table Header mock */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border bg-surfaceHover/30 text-xs font-bold text-textMuted uppercase tracking-wider sticky top-0 z-10">
                    <div className="col-span-3">Sender</div>
                    <div className="col-span-6">Subject</div>
                    <div className="col-span-3 text-right">Received</div>
                </div>

                <div className="flex flex-col">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <RefreshCcw className="w-10 h-10 mb-4 text-border animate-spin-slow" style={{ animationDuration: '3s' }} />
                            <p className="font-semibold text-textMain text-lg mb-1">Your inbox is empty</p>
                            <p className="text-sm text-textMuted">Waiting for incoming emails... Auto-refreshing every 2s.</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                onClick={() => onSelect(msg.id)}
                                className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-border last:border-0 cursor-pointer transition-colors items-center ${selectedId === msg.id
                                        ? 'bg-primary/5 border-l-4 border-l-primary pr-5' // Adjust padding for border
                                        : 'hover:bg-surfaceHover border-l-4 border-l-transparent pr-6'
                                    }`}
                            >
                                <div className="col-span-3 truncate font-semibold text-sm text-textMain flex items-center gap-2">
                                    {!msg.seen && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>}
                                    <span className="truncate">{msg.from.address}</span>
                                </div>

                                <div className="col-span-6 truncate flex flex-col justify-center">
                                    <span className={`text-sm truncate ${!msg.seen ? 'font-semibold text-textMain' : 'text-textMain'}`}>
                                        {msg.subject || '(No Subject)'}
                                    </span>
                                    <span className="text-xs text-textMuted truncate mt-0.5">
                                        {msg.intro}
                                    </span>
                                </div>

                                <div className="col-span-3 text-right text-sm text-textMuted font-medium whitespace-nowrap">
                                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
