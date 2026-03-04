import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MailOpen, Trash2, ArrowLeft, Loader2, Download, FileDown, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function MessageViewer({ message, loading, onDelete, onBack }) {
    const [summary, setSummary] = useState(null);
    const [summarizing, setSummarizing] = useState(false);
    const [summaryError, setSummaryError] = useState(null);

    // Reset summary when message changes
    useEffect(() => {
        setSummary(null);
        setSummaryError(null);
    }, [message?.id]);

    const handleSummarize = async () => {
        if (!message || !message.text) return;
        setSummarizing(true);
        setSummaryError(null);
        try {
            const { data } = await api.post('/summarize', { text: message.text });
            setSummary(data.summary);
        } catch (err) {
            setSummaryError("Failed to generate summary. The AI model might be unavailable right now.");
            console.error(err);
        } finally {
            setSummarizing(false);
        }
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

    const handleDownloadEmail = () => {
        // Determine whether to save as HTML or TXT
        const hasHtml = message.html && message.html.length > 0;
        const extension = hasHtml ? 'html' : 'txt';
        const content = hasHtml ? message.html[0] : message.text;

        const blob = new Blob([content], { type: hasHtml ? 'text/html' : 'text/plain' });
        const url = URL.createObjectURL(blob);

        const element = document.createElement('a');
        element.href = url;

        // Clean up the subject to be a valid filename
        const cleanSubject = (message.subject || 'untitled_email')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');

        element.download = `tempymail_${cleanSubject}.${extension}`;
        document.body.appendChild(element);
        element.click();

        // Cleanup
        document.body.removeChild(element);
        URL.revokeObjectURL(url);
    };

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

                    <div className="flex items-baseline justify-between mb-3">
                        <h2 className="text-2xl font-bold text-textMain tracking-tight leading-snug">
                            {message.subject || '(No Subject)'}
                        </h2>
                    </div>

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

                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end self-start">
                    <button
                        onClick={handleSummarize}
                        disabled={summarizing}
                        className="btn-secondary px-3 py-2 text-primary hover:text-primary hover:border-primary border-transparent gap-2 active:scale-95 group text-sm"
                        title="Summarize with AI"
                    >
                        {summarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span className="font-semibold">AI Summary</span>
                    </button>
                    <button
                        onClick={handleDownloadEmail}
                        className="btn-ghost p-2 text-textMuted hover:text-textMain hover:bg-surfaceHover active:scale-95 group border border-transparent rounded-lg"
                        title="Download Email"
                    >
                        <FileDown className="w-5 h-5" />
                    </button>
                    {message.hasAttachments && (
                        <button className="btn-ghost p-2 text-textMuted hover:text-textMain hover:bg-surfaceHover active:scale-95 border border-transparent rounded-lg" title="Has Attachments">
                            <Download className="w-5 h-5" />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(message.id)}
                        className="btn-ghost p-2 text-textMuted hover:text-red-600 hover:bg-red-50 active:scale-95 group border border-transparent rounded-lg"
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
                                <span>Generating AI summary... (This may take a few seconds)</span>
                            </div>
                        ) : summaryError ? (
                            <p className="text-red-500 text-sm font-medium">{summaryError}</p>
                        ) : (
                            <p className="text-gray-700 text-sm leading-relaxed">{summary}</p>
                        )}
                    </div>
                )}

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
            </div>
        </div>
    );
}
