import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Copy, RefreshCw, Check, Bell, Search, History, ChevronRight, User, Moon, Sun, Globe, Menu, X, QrCode } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../ThemeProvider';
import { useI18n } from '../i18n';
import QRCode from 'qrcode';

export default function Header({ account, generateAccount, refreshInbox, onLogoClick, history = [], recoverAccount, messages = [], onProfileClick, markAllAsSeen }) {
    const [copied, setCopied] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState('');
    const { theme, toggleTheme } = useTheme();
    const { t, lang, setLang, LANGUAGES } = useI18n();

    const unreadCount = messages.filter(m => !m.seen).length;

    const handleCopy = () => {
        if (account?.address) {
            navigator.clipboard.writeText(account.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const generateQR = useCallback(async () => {
        if (account?.address) {
            try {
                const url = await QRCode.toDataURL(`mailto:${account.address}`, {
                    width: 220,
                    margin: 2,
                    color: {
                        dark: theme === 'dark' ? '#F1F5F9' : '#111827',
                        light: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                    },
                });
                setQrDataUrl(url);
            } catch (err) {
                console.error('QR generation failed:', err);
            }
        }
    }, [account?.address, theme]);

    useEffect(() => {
        if (showQR) generateQR();
    }, [showQR, generateQR]);

    return (
        <header className="bg-surface border-b border-border sticky top-0 z-50">
            {/* ── Single header row (both mobile and desktop) ─────────── */}
            <div className="flex items-center gap-2 px-3 sm:px-5 py-2.5">

                {/* Logo */}
                <div
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                    onClick={onLogoClick}
                >
                    <div className="bg-primary p-1.5 rounded-lg flex-shrink-0">
                        <Mail className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-base font-bold text-textMain hidden sm:block tracking-tight">
                        TempyMail
                    </span>
                </div>

                {/* Email bar — grows to fill space */}
                <div className="relative flex-1 min-w-0">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none">
                        <Search className="w-3.5 h-3.5" />
                    </div>
                    <div className="w-full bg-surfaceHover border border-border rounded-lg py-1.5 pl-8 pr-10 text-xs text-textMain font-mono font-medium truncate">
                        {account?.address || t('generatingAddress')}
                    </div>
                    <button
                        onClick={handleCopy}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-textMuted hover:text-primary transition-colors"
                        title={t('copyEmail')}
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                </div>

                {/* ── DESKTOP actions (md and up) ── */}
                <div className="hidden md:flex items-center gap-0.5 flex-shrink-0">
                    <button
                        onClick={generateAccount}
                        className="btn-ghost px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg hover:bg-surfaceHover transition-colors text-textMain"
                    >
                        {t('changeEmail')}
                    </button>

                    {/* Refresh - right next to Change Email */}
                    <button
                        onClick={() => { refreshInbox(); if (markAllAsSeen) markAllAsSeen(); }}
                        className="btn-ghost px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg hover:bg-surfaceHover transition-colors text-textMain relative"
                    >
                        {t('refreshNotif').split(' ')[0]}
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* QR Code */}
                    <button
                        onClick={() => setShowQR(!showQR)}
                        className={`btn-ghost p-1.5 rounded-lg transition-colors ${showQR ? 'bg-surfaceHover text-primary' : 'text-textMain hover:bg-surfaceHover'}`}
                        title="QR Code"
                    >
                        <QrCode className="w-4 h-4" />
                    </button>

                    {/* Language */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLangMenu(!showLangMenu)}
                            className={`btn-ghost px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition-colors ${showLangMenu ? 'bg-surfaceHover text-primary' : 'text-textMain hover:bg-surfaceHover'}`}
                        >
                            {LANGUAGES.find(l => l.code === lang)?.name || 'Language'}
                        </button>
                        {showLangMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                                <div className="absolute right-0 top-full mt-1.5 w-40 bg-surface border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                                    {LANGUAGES.map((l) => (
                                        <button
                                            key={l.code}
                                            onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                                            className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${lang === l.code ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-surfaceHover text-textMain'}`}
                                        >
                                            <span>{l.flag}</span>{l.name}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`btn-ghost px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition-colors ${showHistory ? 'bg-surfaceHover text-primary' : 'text-textMain hover:bg-surfaceHover'}`}
                    >
                        {t('sessionHistory')}
                    </button>


                    <button
                        onClick={onProfileClick}
                        className="btn-ghost p-1.5 rounded-lg hover:bg-surfaceHover transition-colors text-textMain"
                        title={t('premiumAccount')}
                    >
                        <User className="w-4 h-4" />
                    </button>

                    {/* Dark mode - icon only */}
                    <button
                        onClick={toggleTheme}
                        className="btn-ghost p-1.5 rounded-lg transition-colors ml-1"
                        title={theme === 'dark' ? t('lightMode') : t('darkMode')}
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>

                {/* ── MOBILE actions (below md) ── */}
                <div className="flex items-center gap-0.5 md:hidden flex-shrink-0">
                    {/* Change Email icon */}
                    <button
                        onClick={generateAccount}
                        className="btn-ghost p-1.5 rounded-lg transition-colors"
                        title={t('changeEmail')}
                    >
                        <RefreshCw className="w-4 h-4 text-textMain" />
                    </button>

                    {/* Refresh / Bell icon */}
                    <button
                        onClick={() => { refreshInbox(); if (markAllAsSeen) markAllAsSeen(); }}
                        className="btn-ghost p-1.5 rounded-lg transition-colors relative"
                        title={t('refreshNotif')}
                    >
                        <Bell className="w-4 h-4 text-textMain" />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 min-w-[14px] h-[14px] bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Dark mode - icon */}
                    <button
                        onClick={toggleTheme}
                        className="btn-ghost p-1.5 rounded-lg transition-colors"
                        title={theme === 'dark' ? t('lightMode') : t('darkMode')}
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                    </button>

                    {/* Burger menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className={`btn-ghost p-1.5 rounded-lg transition-colors ${showMobileMenu ? 'bg-surfaceHover text-primary' : ''}`}
                        >
                            {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4 text-textMain" />}
                        </button>

                        {showMobileMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
                                <div className="absolute right-0 top-full mt-1.5 w-52 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden py-1">

                                    <button
                                        onClick={() => { setShowMobileMenu(false); setShowQR(true); }}
                                        className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-surfaceHover text-textMain transition-colors flex items-center gap-3"
                                    >
                                        <QrCode className="w-4 h-4 text-textMuted flex-shrink-0" />
                                        QR Code
                                    </button>

                                    <button
                                        onClick={() => { setShowMobileMenu(false); setTimeout(() => setShowHistory(true), 50); }}
                                        className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-surfaceHover text-textMain transition-colors flex items-center gap-3"
                                    >
                                        <History className="w-4 h-4 text-textMuted flex-shrink-0" />
                                        {t('sessionHistory')}
                                    </button>

                                    <button
                                        onClick={() => { onProfileClick(); setShowMobileMenu(false); }}
                                        className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-surfaceHover text-textMain transition-colors flex items-center gap-3"
                                    >
                                        <User className="w-4 h-4 text-textMuted flex-shrink-0" />
                                        {t('premiumAccount')}
                                    </button>

                                    <div className="border-t border-border my-1" />

                                    <div className="px-4 py-2 text-xs font-semibold text-textMuted uppercase tracking-widest flex items-center gap-2">
                                        <Globe className="w-3.5 h-3.5" /> {t('language')}
                                    </div>

                                    {LANGUAGES.map((l) => (
                                        <button
                                            key={l.code}
                                            onClick={() => { setLang(l.code); setShowMobileMenu(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2.5 ${lang === l.code ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-surfaceHover text-textMain'}`}
                                        >
                                            <span className="text-base">{l.flag}</span>{l.name}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* QR Code Modal */}
            {showQR && (
                <>
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setShowQR(false)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
                        <div className="dashboard-panel p-6 max-w-xs w-full text-center" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-textMain flex items-center gap-2">
                                    <QrCode className="w-4 h-4 text-primary" />
                                    Scan to Email
                                </h3>
                                <button onClick={() => setShowQR(false)} className="p-1 rounded-lg hover:bg-surfaceHover text-textMuted">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {qrDataUrl ? (
                                <img src={qrDataUrl} alt="QR Code" className="mx-auto rounded-xl mb-3" />
                            ) : (
                                <div className="w-[220px] h-[220px] mx-auto rounded-xl bg-surfaceHover flex items-center justify-center mb-3">
                                    <span className="text-textMuted text-xs">Generating...</span>
                                </div>
                            )}
                            <p className="font-mono text-xs text-textMuted break-all">{account?.address}</p>
                            <p className="text-[10px] text-textMuted/60 mt-2">Scan this QR code to send an email to this address</p>
                        </div>
                    </div>
                </>
            )}

            {/* History panel */}
            {showHistory && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowHistory(false)} />
                    <div className="absolute right-3 sm:right-5 top-full mt-1 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <h3 className="font-bold text-textMain text-sm">{t('recentInboxes')}</h3>
                            <p className="text-xs text-textMuted mt-0.5">{t('recoverPast')}</p>
                        </div>
                        <div className="max-h-60 overflow-y-auto hide-scrollbar p-2">
                            {history.length === 0 ? (
                                <div className="p-4 text-center text-textMuted text-sm">{t('noRecentInboxes')}</div>
                            ) : (
                                history.map((item) => {
                                    const isActive = item.address === account?.address;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => { if (!isActive) { recoverAccount(item.address); setShowHistory(false); } }}
                                            disabled={isActive}
                                            className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors mb-0.5 ${isActive ? 'bg-primary/10 border border-primary/20 cursor-default' : 'hover:bg-surfaceHover border border-transparent'}`}
                                        >
                                            <div className="overflow-hidden pr-2">
                                                <p className={`font-mono font-medium text-xs truncate ${isActive ? 'text-primary' : 'text-textMain'}`}>
                                                    {item.address}
                                                </p>
                                                <p className="text-xs text-textMuted mt-0.5">
                                                    {isActive ? t('currentSession') : formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                            {!isActive && <ChevronRight className="w-4 h-4 text-textMuted flex-shrink-0" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </header>
    );
}
