import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
    MailOpen, Trash2, ArrowLeft, Loader2, Download, FileDown,
    Sparkles, Paperclip, Reply, Send, X, File, Clock, ChevronDown
} from 'lucide-react';
import { api } from '../services/api';

export default function MessageViewer({ message, loading, onDelete, onBack }) {
    const [summary, setSummary] = useState(null);
    const [summarizing, setSummarizing] = useState(false);
    const [summaryError, setSummaryError] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [showReply, setShowReply] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [replySending, setReplySending] = useState(false);
    const [replySuccess, setReplySuccess] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    // Reset state when message changes
    useEffect(() => {
        setSummary(null);
        setSummaryError(null);
        setAttachments([]);
        setShowReply(false);
        setReplyBody('');
        setReplySuccess(false);
        setShowDetails(false);

        if (message?.hasAttachments) {
            const addr = message.to?.[0]?.address || '';
            api.get(`/messages/${message.id}/attachments`, { params: { address: addr } })
                .then(({ data }) => setAttachments(data.attachments || []))
                .catch(() => { });
        }
    }, [message?.id]);

    const handleSummarize = async () => {
        if (!message) return;

        const isPremium = !!localStorage.getItem('premium_email');
        if (!isPremium) {
            const today = new Date().toISOString().split('T')[0];
            const limitData = JSON.parse(localStorage.getItem('ai_summary_limit') || '{}');
            const todayCount = limitData.date === today ? (limitData.count || 0) : 0;
            if (todayCount >= 2) {
                setSummaryError("Daily AI summary limit reached (2/day). Upgrade to Premium for unlimited!");
                return;
            }
            localStorage.setItem('ai_summary_limit', JSON.stringify({ date: today, count: todayCount + 1 }));
        }

        let textContent = message.text;
        if (!textContent && message.html && message.html.length > 0) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = Array.isArray(message.html) ? message.html[0] : message.html;
            textContent = tempDiv.textContent || tempDiv.innerText || '';
        }

        if (!textContent || textContent.trim().length < 20) {
            setSummaryError("Email content is too short to summarize.");
            return;
        }

        setSummarizing(true);
        setSummaryError(null);
        try {
            const { data } = await api.post('/summarize', { text: textContent });
            setSummary(data.summary);
        } catch (err) {
            setSummaryError("Failed to generate summary. Try again later.");
        } finally {
            setSummarizing(false);
        }
    };

    const handleDownloadEml = () => {
        const addr = encodeURIComponent(message.to?.[0]?.address || '');
        const url = `${api.defaults.baseURL}/messages/${message.id}/download?address=${addr}`;
        window.open(url, '_blank');
    };

    const handleDownloadAttachment = (attachmentId, filename) => {
        const addr = encodeURIComponent(message.to?.[0]?.address || '');
        const url = `${api.defaults.baseURL}/attachments/${attachmentId}?address=${addr}`;
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    };

    const handleReply = async () => {
        if (!replyBody.trim()) return;
        setReplySending(true);
        try {
            await api.post('/messages/reply', {
                from_address: message.to?.[0]?.address || '',
                to_address: message.from?.address || '',
                subject: `Re: ${message.subject || ''}`,
                body: replyBody,
                in_reply_to: message.id
            });
            setReplySuccess(true);
            setTimeout(() => {
                setShowReply(false);
                setReplyBody('');
                setReplySuccess(false);
            }, 2000);
        } catch (err) {
            alert('Failed to send reply: ' + (err.response?.data?.detail || err.message));
        } finally {
            setReplySending(false);
        }
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (loading) {
        return (
            <div className="dashboard-panel h-full flex flex-col items-center justify-center p-8 bg-surface/50">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-textMain font-medium">Loading message...</p>
            </div>
        );
    }

    if (!message) {
        return (
            <div className="dashboard-panel h-full flex flex-col items-center justify-center p-8 text-center bg-surface/50 border-dashed border-2">
                <div className="p-6 rounded-full mb-6 bg-surfaceHover border border-border">
                    <MailOpen className="w-12 h-12 text-textMuted" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-textMain tracking-tight">Select a Message</h3>
                <p className="text-textMuted max-w-sm text-sm">
                    Choose an email from your inbox to view its contents here.
                </p>
            </div>
        );
    }

    const senderInitial = message.from.address.charAt(0).toUpperCase();
    const senderName = message.from.name || message.from.address.split('@')[0];
    const dateStr = format(new Date(message.createdAt), 'MMM d, yyyy · h:mm a');

    return (
        <div className="dashboard-panel h-full flex flex-col overflow-hidden">

            {/* ── Top Bar: Back + Actions ── */}
            <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 border-b border-border bg-surface flex-shrink-0">
                {/* Back button (mobile) */}
                <button
                    onClick={onBack}
                    className="lg:hidden flex items-center gap-1.5 text-textMuted hover:text-textMain text-sm font-semibold px-2.5 py-1.5 rounded-lg hover:bg-surfaceHover active:scale-95 transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="sm:inline">Inbox</span>
                </button>

                {/* Spacer on desktop */}
                <div className="hidden lg:block" />

                {/* Action buttons */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleSummarize}
                        disabled={summarizing}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-50"
                        title="AI Summary"
                    >
                        {summarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">Summarize</span>
                    </button>
                    <button
                        onClick={() => setShowReply(!showReply)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-all ${showReply ? 'text-primary bg-primary/5' : 'text-textMuted hover:text-textMain hover:bg-surfaceHover'}`}
                        title="Reply"
                    >
                        <Reply className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Reply</span>
                    </button>
                    <button
                        onClick={handleDownloadEml}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-textMuted hover:text-textMain hover:bg-surfaceHover active:scale-95 transition-all"
                        title="Download .eml"
                    >
                        <FileDown className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download</span>
                    </button>
                    <button
                        onClick={() => onDelete(message.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-textMuted hover:text-red-500 hover:bg-red-50 active:scale-95 transition-all"
                        title="Delete"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                    </button>
                </div>
            </div>

            {/* ── Scrollable Content ── */}
            <div className="flex-1 overflow-y-auto">

                {/* Subject + Sender Card */}
                <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-border">
                    <h2 className="text-lg sm:text-xl font-bold text-textMain tracking-tight leading-snug mb-4">
                        {message.subject || '(No Subject)'}
                    </h2>

                    <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                            {senderInitial}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-textMain">{senderName}</span>
                                <span className="text-xs text-textMuted">{'<'}{message.from.address}{'>'}</span>
                            </div>
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="text-xs text-textMuted hover:text-textMain mt-0.5 flex items-center gap-1 transition-colors"
                            >
                                <span>{dateStr}</span>
                                <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Expandable details */}
                            {showDetails && (
                                <div className="mt-2 text-xs text-textMuted space-y-1 p-2.5 bg-surfaceHover rounded-lg border border-border">
                                    <div><span className="font-semibold text-textMain/70 w-10 inline-block">From:</span> {message.from.address}</div>
                                    {message.to && <div><span className="font-semibold text-textMain/70 w-10 inline-block">To:</span> {message.to.map(t => t.address).join(', ')}</div>}
                                    <div><span className="font-semibold text-textMain/70 w-10 inline-block">Date:</span> {format(new Date(message.createdAt), 'EEEE, MMMM d, yyyy h:mm:ss a')}</div>
                                    {message.id && <div><span className="font-semibold text-textMain/70 w-10 inline-block">ID:</span> <span className="font-mono text-[10px]">{message.id}</span></div>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content area */}
                <div className="px-4 sm:px-6 py-5">

                    {/* AI Summary Banner */}
                    {(summary || summarizing || summaryError) && (
                        <div className="mb-5 p-4 rounded-xl bg-green-50/60 border border-green-200/60 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-full" />
                            <div className="flex items-start gap-3 pl-2">
                                <div className="p-1.5 bg-green-100 rounded-lg flex-shrink-0 mt-0.5">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-gray-900 mb-1">AI Summary</h4>
                                    {summarizing ? (
                                        <div className="flex items-center gap-2 text-primary text-sm font-medium">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Generating summary...</span>
                                        </div>
                                    ) : summaryError ? (
                                        <p className="text-red-500 text-sm">{summaryError}</p>
                                    ) : (
                                        <p className="text-gray-700 text-sm leading-relaxed">{summary}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reply Compose */}
                    {showReply && (
                        <div className="mb-5 p-4 rounded-xl bg-surfaceHover border border-border">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-sm text-textMain flex items-center gap-2">
                                    <Reply className="w-4 h-4 text-primary" />
                                    Reply to {senderName}
                                </h4>
                                <button onClick={() => setShowReply(false)} className="p-1 rounded-md text-textMuted hover:text-textMain hover:bg-surface transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <textarea
                                value={replyBody}
                                onChange={(e) => setReplyBody(e.target.value)}
                                placeholder="Type your reply..."
                                className="w-full h-28 p-3 rounded-lg bg-surface border border-border text-textMain text-sm resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-textMuted"
                                autoFocus
                            />
                            <div className="flex justify-between items-center mt-3">
                                {replySuccess ? (
                                    <span className="text-xs text-primary font-bold flex items-center gap-1">
                                        ✓ Reply sent!
                                    </span>
                                ) : (
                                    <span className="text-xs text-textMuted">{replyBody.length > 0 ? `${replyBody.length} chars` : ''}</span>
                                )}
                                <button
                                    onClick={handleReply}
                                    disabled={replySending || !replyBody.trim()}
                                    className="btn-primary px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 disabled:opacity-40"
                                >
                                    {replySending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                    Send
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Attachments */}
                    {attachments.length > 0 && (
                        <div className="mb-5 p-4 rounded-xl bg-surfaceHover border border-border">
                            <h4 className="font-bold text-xs text-textMuted uppercase tracking-wider flex items-center gap-2 mb-3">
                                <Paperclip className="w-3.5 h-3.5" />
                                {attachments.length} Attachment{attachments.length > 1 ? 's' : ''}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {attachments.map((att) => (
                                    <button
                                        key={att.id}
                                        onClick={() => handleDownloadAttachment(att.id, att.filename)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border hover:border-primary/40 hover:shadow-sm transition-all group text-left"
                                    >
                                        <div className="p-1.5 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                                            <File className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-textMain truncate max-w-[150px]">{att.filename}</p>
                                            <p className="text-[10px] text-textMuted">{formatSize(att.size)}</p>
                                        </div>
                                        <Download className="w-3 h-3 text-textMuted group-hover:text-primary flex-shrink-0 ml-1" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Email Body */}
                    <div className="max-w-full">
                        {message.html && message.html.length > 0 ? (
                            <iframe
                                srcDoc={message.html[0]}
                                title="Email content"
                                sandbox="allow-same-origin"
                                className="w-full rounded-xl border border-border bg-white"
                                style={{ minHeight: '300px' }}
                                onLoad={(e) => {
                                    try {
                                        const doc = e.target.contentWindow.document;
                                        const height = Math.max(doc.documentElement.scrollHeight, 300);
                                        e.target.style.height = Math.min(height, 800) + 'px';
                                    } catch { }
                                }}
                            />
                        ) : (
                            <div className="bg-surface rounded-xl border border-border p-4 sm:p-6">
                                <pre className="whitespace-pre-wrap font-sans text-textMain leading-relaxed text-sm">
                                    {message.text || '(No content)'}
                                </pre>
                            </div>
                        )}
                    </div>

                    {/* Reply Thread */}
                    {message.replies && message.replies.length > 0 && (
                        <div className="mt-6 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-px bg-border flex-1" />
                                <span className="text-[10px] font-bold text-textMuted uppercase tracking-widest">Replies ({message.replies.length})</span>
                                <div className="h-px bg-border flex-1" />
                            </div>
                            {message.replies.map((reply) => (
                                <div key={reply.id} className="p-4 rounded-xl bg-surfaceHover border border-border">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                You
                                            </div>
                                            <div>
                                                <p className="font-semibold text-xs text-textMain">You replied</p>
                                                <p className="text-[10px] text-textMuted">to {reply.to[0].address}</p>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-textMuted flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {format(new Date(reply.createdAt), 'MMM d, h:mm a')}
                                        </div>
                                    </div>
                                    <pre className="whitespace-pre-wrap font-sans text-textMain leading-relaxed text-sm pt-2 border-t border-border">
                                        {reply.text}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
