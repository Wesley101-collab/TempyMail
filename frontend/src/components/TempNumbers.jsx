import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Phone, Copy, Check, Search, X, ArrowLeft, RefreshCw, MessageSquare, Globe, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import AdBanner from './AdBanner';

const COUNTRY_ORDER = ['United States', 'United Kingdom', 'Canada', 'Germany', 'Netherlands', 'France', 'Spain', 'Italy'];

export default function TempNumbers({ onBack }) {
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [countryFilter, setCountryFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [copied, setCopied] = useState('');
    const [error, setError] = useState('');

    const fetchNumbers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/temp-numbers/list');
            setNumbers(res.data.numbers || []);
        } catch (err) {
            setError('Failed to load numbers. Please try again.');
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchNumbers(); }, [fetchNumbers]);

    const fetchMessages = useCallback(async (number) => {
        setMessagesLoading(true);
        try {
            const res = await api.get(`/temp-numbers/messages/${number}`);
            setMessages(res.data.messages || []);
        } catch {
            setMessages([]);
        }
        setMessagesLoading(false);
    }, []);

    const handleSelectNumber = (num) => {
        setSelectedNumber(num);
        fetchMessages(num.number);
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(''), 2000);
    };

    const countries = useMemo(() => {
        const set = new Set(numbers.map(n => n.country));
        const sorted = [...set].sort((a, b) => {
            const ai = COUNTRY_ORDER.indexOf(a);
            const bi = COUNTRY_ORDER.indexOf(b);
            if (ai !== -1 && bi !== -1) return ai - bi;
            if (ai !== -1) return -1;
            if (bi !== -1) return 1;
            return a.localeCompare(b);
        });
        return sorted;
    }, [numbers]);

    const filtered = useMemo(() => {
        let list = numbers;
        if (countryFilter !== 'All') {
            list = list.filter(n => n.country === countryFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(n =>
                n.display.includes(q) ||
                n.country.toLowerCase().includes(q)
            );
        }
        return list;
    }, [numbers, countryFilter, searchQuery]);

    // Group by country
    const grouped = useMemo(() => {
        const map = {};
        filtered.forEach(n => {
            if (!map[n.country]) map[n.country] = { flag: n.flag, numbers: [] };
            map[n.country].numbers.push(n);
        });
        return map;
    }, [filtered]);

    if (selectedNumber) {
        return (
            <div className="min-h-screen bg-background text-textMain">
                {/* Header */}
                <div className="sticky top-0 z-30 bg-surface border-b border-border px-3 sm:px-5 py-2.5">
                    <div className="max-w-4xl mx-auto flex items-center gap-3">
                        <button onClick={() => { setSelectedNumber(null); setMessages([]); }} className="p-1.5 rounded-lg hover:bg-surfaceHover transition-colors">
                            <ArrowLeft className="w-5 h-5 text-textMuted" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-textMain truncate">{selectedNumber.display}</p>
                            <p className="text-xs text-textMuted">{selectedNumber.flag} {selectedNumber.country}</p>
                        </div>
                        <button
                            onClick={() => handleCopy(selectedNumber.display)}
                            className="btn-primary px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                        >
                            {copied === selectedNumber.display ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied === selectedNumber.display ? 'Copied!' : 'Copy'}
                        </button>
                        <button onClick={() => fetchMessages(selectedNumber.number)} className="p-1.5 rounded-lg hover:bg-surfaceHover transition-colors text-textMuted">
                            <RefreshCw className={`w-4 h-4 ${messagesLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Ad: between header and messages */}
                <div className="max-w-4xl mx-auto px-3 sm:px-5 pt-3">
                    <AdBanner position="numbers-top" className="mb-3" />
                </div>

                {/* Messages */}
                <div className="max-w-4xl mx-auto p-3 sm:p-5">
                    {messagesLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                            <p className="text-sm text-textMuted">Loading messages...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <MessageSquare className="w-10 h-10 text-textMuted mb-3" />
                            <p className="font-semibold text-textMain mb-1">No messages yet</p>
                            <p className="text-sm text-textMuted">Messages sent to this number will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {messages.map((msg, i) => (
                                <React.Fragment key={i}>
                                    <div className="dashboard-panel p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{msg.sender}</span>
                                            <span className="text-xs text-textMuted">{msg.time}</span>
                                        </div>
                                        <p className="text-sm text-textMain leading-relaxed break-words">{msg.text}</p>
                                    </div>
                                    {/* Ad: after every 5th message */}
                                    {(i + 1) % 5 === 0 && i < messages.length - 1 && (
                                        <AdBanner position={`numbers-msg-${i}`} className="my-2" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    {/* Ad: bottom of messages */}
                    <AdBanner position="numbers-bottom" className="mt-4" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-textMain">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-surface border-b border-border px-3 sm:px-5 py-2.5">
                <div className="max-w-6xl mx-auto flex items-center gap-3">
                    <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-surfaceHover transition-colors">
                        <ArrowLeft className="w-5 h-5 text-textMuted" />
                    </button>
                    <div className="bg-primary p-1.5 rounded-lg flex-shrink-0">
                        <Phone className="w-4 h-4 text-white" />
                    </div>
                    <h1 className="text-base font-bold text-textMain tracking-tight">Temp Numbers</h1>
                    <span className="bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full font-bold ml-1">
                        {numbers.length}
                    </span>
                    {loading && <Loader2 className="w-4 h-4 text-primary animate-spin ml-1" />}
                    <button onClick={fetchNumbers} className="ml-auto p-1.5 rounded-lg hover:bg-surfaceHover transition-colors text-textMuted" title="Refresh">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-3 sm:p-5">
                {/* Search + Filter */}
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textMuted pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by number or country..."
                            className="w-full bg-surface border border-border rounded-lg py-2 pl-8 pr-8 text-sm text-textMain placeholder:text-textMuted outline-none focus:border-primary transition-colors"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-textMuted hover:text-textMain">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
                        <button
                            onClick={() => setCountryFilter('All')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${countryFilter === 'All' ? 'bg-primary text-white' : 'bg-surface border border-border text-textMain hover:bg-surfaceHover'
                                }`}
                        >
                            <Globe className="w-3 h-3 inline mr-1" />All
                        </button>
                        {countries.slice(0, 8).map(c => {
                            const flag = numbers.find(n => n.country === c)?.flag || '🌍';
                            return (
                                <button
                                    key={c}
                                    onClick={() => setCountryFilter(c)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${countryFilter === c ? 'bg-primary text-white' : 'bg-surface border border-border text-textMain hover:bg-surfaceHover'
                                        }`}
                                >
                                    {flag} {c.length > 12 ? c.slice(0, 10) + '…' : c}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Ad: top of number list */}
                <AdBanner position="numbers-list-top" className="mb-4" />

                {/* Error */}
                {error && (
                    <div className="dashboard-panel p-6 text-center mb-4">
                        <p className="text-red-400 font-semibold mb-2">{error}</p>
                        <button onClick={fetchNumbers} className="btn-primary px-4 py-2 text-sm font-semibold rounded-lg">Retry</button>
                    </div>
                )}

                {/* Loading */}
                {loading && numbers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                        <p className="text-sm text-textMuted font-medium">Fetching available numbers...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Phone className="w-8 h-8 text-textMuted mb-3" />
                        <p className="font-semibold text-textMain mb-1">No numbers found</p>
                        <p className="text-sm text-textMuted">Try a different search or filter.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(grouped).map(([country, data], groupIdx) => (
                            <React.Fragment key={country}>
                                <div>
                                    <h2 className="text-sm font-bold text-textMain mb-2 flex items-center gap-2">
                                        <span className="text-lg">{data.flag}</span> {country}
                                        <span className="text-xs text-textMuted font-normal">({data.numbers.length})</span>
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {data.numbers.map(num => (
                                            <button
                                                key={num.number}
                                                onClick={() => handleSelectNumber(num)}
                                                className="dashboard-panel p-3.5 flex items-center gap-3 hover:border-primary/40 transition-all group text-left"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                                                    <Phone className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-mono font-bold text-sm text-textMain truncate">{num.display}</p>
                                                    <p className="text-xs text-textMuted">{num.flag} {num.country}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCopy(num.display); }}
                                                        className="p-1.5 rounded-lg hover:bg-surfaceHover text-textMuted hover:text-primary transition-colors"
                                                        title="Copy number"
                                                    >
                                                        {copied === num.display ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <ChevronRight className="w-4 h-4 text-textMuted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Ad: after every 2nd country group */}
                                {(groupIdx + 1) % 2 === 0 && groupIdx < Object.keys(grouped).length - 1 && (
                                    <AdBanner position={`numbers-group-${groupIdx}`} className="my-2" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* Ad: bottom of page */}
                <AdBanner position="numbers-list-bottom" className="mt-6" />
            </div>
        </div>
    );
}
