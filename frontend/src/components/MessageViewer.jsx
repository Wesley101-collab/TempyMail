import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
    MailOpen, Trash2, ArrowLeft, Loader2, Download, FileDown,
    Sparkles, Paperclip, Reply, Send, X, File, Clock
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

    // Reset state when message changes
    useEffect(() => {
        setSummary(null);
        setSummaryError(null);
        setAttachments([]);
        setShowReply(false);
        setReplyBody('');
        setReplySuccess(false);

        if (message?.hasAttachments) {
            api.get(`/messages/${message.id}/attachments`)
                .then(({ data }) => setAttachments(data.attachments || []))
                .catch(() => { });
        }
    }, [message?.id]);

    const handleSummarize = async () => {
        if (!message) return;

        // Check daily AI summary limit for free users
        const isPremium = !!localStorage.getItem('premium_email');
        if (!isPremium) {
            const today = new Date().toISOString().split('T')[0];
            const limitData = JSON.parse(localStorage.getItem('ai_summary_limit') || '{}');
            const todayCount = limitData.date === today ? (limitData.count || 0) : 0;
            if (todayCount >= 2) {
                setSummaryError("Daily AI summary limit reached (2/day for free users). Upgrade to Premium for unlimited summaries!");
                return;
            }
            // Increment count
            localStorage.setItem('ai_summary_limit', JSON.stringify({ date: today, count: todayCount + 1 }));
        }

        // Get text content — either from text field or extract from HTML
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
            setSummaryError("Failed to generate summary. The AI model might be unavailable right now.");
        } finally {
            setSummarizing(false);
        }
    };


    const handleDownloadEml = () => {
        const url = `${api.defaults.baseURL}/messages/${message.id}/download`;
        window.open(url, '_blank');
    };

    const handleDownloadAttachment = (attachmentId, filename) => {
        const url = `${api.defaults.baseURL}/attachments/${attachmentId}`;
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
                <p className="text-textMain font-medium">Decrypting message...</p>
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

    return (
        <div className="dashboard-panel h-full flex flex-col overflow-hidden">
            {/* Header section */}
            <div className="p-6 border-b border-border bg-surface flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                <div className="flex-1 w-full relative">
                    <div className="flex items-center gap-3 mb-4 lg:hidden">
                        <button onClick={onBack} className="text-textMuted hover:text-textMain transition-colors flex items-center gap-1.5 text-sm font-semibold hover:bg-surfaceHover px-3 py-1.5 rounded-lg border border-border active:scale-95">
                            <ArrowLeft className="w-4 h-4" /> Back to Inbox
                        </button>
                    </div>

                    <h2 className="text-2xl font-bold text-textMain tracking-tight leading-snug mb-3">
                        {message.subject || '(No Subject)'}
                    </h2>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                {message.from.address.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-semibold text-textMain">{message.from.name || message.from.address.split('@')[0]}</div>
                                <div className="text-textMuted text-xs">{message.from.address}</div>
                            </div>
                        </div>

                        <div className="hidden sm:block w-px h-8 bg-border mx-2"></div>

                        <div className="text-textMuted font-medium text-xs bg-surfaceHover px-3 py-1.5 rounded-md border border-border">
                            {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end self-start flex-wrap">
                    <button
                        onClick={handleSummarize}
                        disabled={summarizing}
                        className="btn-secondary px-3 py-2 text-primary hover:text-primary hover:border-primary border-transparent gap-2 active:scale-95 text-sm"
                        title="Summarize with AI"
                    >
                        {summarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span className="font-semibold">AI Summary</span>
                    </button>
                    <button
                        onClick={() => setShowReply(!showReply)}
                        className={`btn-ghost p-2 hover:bg-surfaceHover active:scale-95 border border-transparent rounded-lg ${showReply ? 'text-primary bg-primary/5' : 'text-textMuted hover:text-textMain'}`}
                        title="Reply"
                    >
                        <Reply className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleDownloadEml}
                        className="btn-ghost p-2 text-textMuted hover:text-textMain hover:bg-surfaceHover active:scale-95 border border-transparent rounded-lg"
                        title="Download as .eml"
                    >
                        <FileDown className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onDelete(message.id)}
                        className="btn-ghost p-2 text-textMuted hover:text-red-600 hover:bg-red-50 active:scale-95 border border-transparent rounded-lg"
                        title="Delete Message"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-surface rounded-b-2xl relative">

                {/* AI Summary Banner */}
                {(summary || summarizing || summaryError) && (
                    <div className="mb-8 p-6 rounded-xl bg-green-50/50 border border-green-200/50 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-1.5 bg-green-100 rounded-lg">
                                <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">AI Summary</h3>
                        </div>
                        {summarizing ? (
                            <div className="flex items-center gap-3 text-primary text-sm font-medium py-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Generating AI summary...</span>
                            </div>
                        ) : summaryError ? (
                            <p className="text-red-500 text-sm font-medium">{summaryError}</p>
                        ) : (
                            <p className="text-gray-700 text-sm leading-relaxed">{summary}</p>
                        )}
                    </div>
                )}

                {/* Reply Compose */}
                {showReply && (
                    <div className="mb-8 p-5 rounded-xl bg-surfaceHover border border-border">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-sm text-textMain flex items-center gap-2">
                                <Reply className="w-4 h-4 text-primary" />
                                Reply to {message.from.address}
                            </h4>
                            <button onClick={() => setShowReply(false)} className="text-textMuted hover:text-textMain">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <textarea
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            placeholder="Type your reply..."
                            className="w-full h-32 p-3 rounded-lg bg-surface border border-border text-textMain text-sm resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                        />
                        <div className="flex justify-end mt-3 gap-2">
                            {replySuccess && (
                                <span className="text-xs text-primary font-bold flex items-center gap-1 mr-auto">
                                    ✓ Reply sent!
                                </span>
                            )}
                            <button
                                onClick={handleReply}
                                disabled={replySending || !replyBody.trim()}
                                className="btn-primary px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                {replySending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send Reply
                            </button>
                        </div>
                    </div>
                )}

                {/* Attachments */}
                {attachments.length > 0 && (
                    <div className="mb-8 p-5 rounded-xl bg-surfaceHover border border-border">
                        <h4 className="font-bold text-sm text-textMain flex items-center gap-2 mb-3">
                            <Paperclip className="w-4 h-4 text-primary" />
                            Attachments ({attachments.length})
                        </h4>
                        <div className="space-y-2">
                            {attachments.map((att) => (
                                <div
                                    key={att.id}
                                    onClick={() => handleDownloadAttachment(att.id, att.filename)}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border hover:border-primary/30 cursor-pointer transition-colors group"
                                >
                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <File className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-textMain truncate">{att.filename}</p>
                                        <p className="text-xs text-textMuted">{formatSize(att.size)} · {att.content_type}</p>
                                    </div>
                                    <Download className="w-4 h-4 text-textMuted group-hover:text-primary flex-shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Email Body */}
                <div className="max-w-4xl">
                    {message.html && message.html.length > 0 ? (
                        <div
                            className="prose prose-sm sm:prose-base max-w-none prose-a:text-primary hover:prose-a:text-secondary prose-img:rounded-xl prose-img:border prose-img:border-border prose-headings:text-textMain prose-p:text-gray-700"
                            dangerouslySetInnerHTML={{ __html: message.html[0] }}
                        />
                    ) : (
                        <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed text-sm">
                            {message.text}
                        </pre>
                    )}
                </div>

                {/* Reply Thread */}
                {message.replies && message.replies.length > 0 && (
                    <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-px bg-border flex-1 border-dashed"></div>
                            <span className="text-xs font-bold text-textMuted uppercase tracking-wider">Conversation History</span>
                            <div className="h-px bg-border flex-1 border-dashed"></div>
                        </div>
                        {message.replies.map((reply, index) => (
                            <div key={reply.id} className="p-5 rounded-xl bg-surfaceHover border border-border">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                            Me
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-textMain">You (Reply)</p>
                                            <p className="text-xs text-textMuted">To: {reply.to[0].address}</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-textMuted flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        {format(new Date(reply.createdAt), 'MMM d, yyyy h:mm a')}
                                    </div>
                                </div>
                                <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed text-sm mt-3 pt-3 border-t border-border">
                                    {reply.text}
                                </pre>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
