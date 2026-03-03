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
            <div className="glass-panel h-full flex flex-col items-center justify-center p-8 bg-surface/30">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-5 shadow-[0_0_15px_rgba(102,252,241,0.5)] rounded-full" />
                <p className="text-primary text-lg font-medium tracking-wide">Decrypting message...</p>
            </div>
        );
    }

    if (!message) {
        return (
            <div className="glass-panel h-full flex flex-col items-center justify-center p-8 text-center bg-surface/20">
                <div className="p-8 rounded-full mb-6 glass-card shadow-[0_0_30px_rgba(69,162,158,0.15)] bg-surface/50 border-white/5">
                    <MailOpen className="w-20 h-20 text-secondary opacity-80" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-text-main tracking-tight">Select a Message</h3>
                <p className="text-text-muted max-w-sm text-lg leading-relaxed mix-blend-screen">
                    Choose an email from your inbox to view its encrypted contents here in real-time.
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
        <div className="glass-panel h-full flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 bg-surface-hover flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                <div className="flex-1 w-full relative">
                    <div className="flex items-center gap-3 mb-3 lg:hidden">
                        <button onClick={onBack} className="text-text-muted hover:text-primary transition-all flex items-center gap-1.5 text-sm font-semibold bg-surface px-4 py-2 rounded-xl border border-white/10 shadow-lg active:scale-95">
                            <ArrowLeft className="w-4 h-4" /> Back to Inbox
                        </button>
                    </div>
                    <h2 className="text-3xl font-extrabold text-text-main mb-3 tracking-tight leading-snug drop-shadow-md">
                        {message.subject || '(No Subject)'}
                    </h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-text-muted font-medium tracking-wide">From:</span>
                            <span className="font-bold text-primary bg-primary/10 px-3 py-1 rounded-md border border-primary/20 shadow-sm">
                                {message.from.address}
                            </span>
                        </div>
                        <span className="hidden sm:inline text-text-muted/50">•</span>
                        <span className="text-text-muted font-medium flex items-center gap-2 bg-surface/80 px-3 py-1 rounded-md border border-white/5">
                            {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                    </div>
                </div>

                <div className="flex gap-3 w-full sm:w-auto mt-4 sm:mt-0 justify-end">
                    <button
                        onClick={handleSummarize}
                        disabled={summarizing}
                        className="p-2.5 text-text-muted hover:text-purple-400 hover:bg-purple-400/20 rounded-xl transition-all border border-transparent hover:border-purple-400/30 shadow-sm tooltip active:scale-95 group flex items-center gap-2"
                        title="Summarize with AI"
                    >
                        {summarizing ? <Loader2 className="w-5 h-5 animate-spin text-purple-400" /> : <Sparkles className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform text-purple-400" />}
                        <span className="hidden lg:inline font-bold text-sm text-purple-400 group-hover:text-purple-300">Summarize</span>
                    </button>
                    <button
                        onClick={handleDownloadEmail}
                        className="p-2.5 text-text-muted hover:text-primary hover:bg-primary/20 rounded-xl transition-all border border-transparent hover:border-primary/30 shadow-sm tooltip active:scale-95 group"
                        title="Download Email"
                    >
                        <FileDown className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform text-primary" />
                    </button>
                    {message.hasAttachments && (
                        <button className="p-2.5 text-text-muted hover:text-primary hover:bg-primary/20 rounded-xl transition-all border border-transparent hover:border-primary/30 shadow-sm tooltip active:scale-95" title="Has Attachments">
                            <Download className="w-5 h-5" />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(message.id)}
                        className="p-2.5 text-text-muted hover:text-red-400 hover:bg-red-400/20 rounded-xl transition-all border border-transparent hover:border-red-400/30 shadow-sm tooltip active:scale-95 group"
                        title="Delete Message"
                    >
                        <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-[#fdfdfd] rounded-b-2xl shadow-inner relative" style={{ color: '#1a1a1a' }}>

                {/* AI Summary Banner */}
                {(summary || summarizing || summaryError) && (
                    <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-indigo-500"></div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Sparkles className="w-5 h-5 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">AI Summary</h3>
                        </div>

                        {summarizing ? (
                            <div className="flex items-center gap-3 text-purple-600 font-medium py-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Generating summary using HuggingFace... (This may take a few seconds)</span>
                            </div>
                        ) : summaryError ? (
                            <p className="text-red-500 font-medium">{summaryError}</p>
                        ) : (
                            <p className="text-gray-700 leading-relaxed font-medium">{summary}</p>
                        )}
                    </div>
                )}

                {message.html && message.html.length > 0 ? (
                    <div
                        className="prose prose-sm sm:prose-base max-w-none prose-a:text-blue-600 hover:prose-a:text-blue-800 prose-img:rounded-xl prose-img:shadow-md prose-headings:text-gray-900 prose-p:text-gray-800"
                        dangerouslySetInnerHTML={{ __html: message.html[0] }}
                    />
                ) : (
                    <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed text-base bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
                        {message.text}
                    </pre>
                )}
            </div>
        </div>
    );
}
