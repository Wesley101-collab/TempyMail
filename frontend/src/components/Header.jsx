import React, { useState } from 'react';
import { Mail, Copy, RefreshCw, Check, Bell, Search, History, ChevronRight, User, Moon, Sun, Globe, Menu, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../ThemeProvider';
import { useI18n } from '../i18n';

export default function Header({ account, generateAccount, refreshInbox, onLogoClick, history = [], recoverAccount, messages = [], onProfileClick, markAllAsSeen }) {
    const [copied, setCopied] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
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

    const closeMobileMenu = () => setShowMobileMenu(false);

    return (
        <header className="bg-surface border-b border-border px-3 sm:px-5 py-3 flex items-center justify-between sticky top-0 z-50 relative">
            {/* Left: Logo */}
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0" onClick={onLogoClick}>
                <div className="bg-primary p-1.5 rounded-lg">
                    <Mail className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold text-textMain tracking-tight hidden sm:block">
                    TempyMail
                </h1>
            </div>

            {/* Middle: Email address bar */}
            <div className="flex flex-1 mx-2 sm:mx-4 max-w-md">
                <div className="relative w-full flex items-center">
                    <div className="absolute left-3 text-textMuted">
                        <Search className="w-4 h-4" />
                    </div>
                    <div className="w-full bg-surfaceHover border border-border rounded-lg py-2 pl-9 pr-10 text-xs sm:text-sm text-textMain font-mono font-medium truncate">
                        {account?.address || t('generatingAddress')}
                    </div>
                    <button
                        onClick={handleCopy}
                        className="absolute right-2 p-1.5 text-textMuted hover:text-primary bg-surfaceHover hover:bg-surface rounded-md transition-colors"
                        title={t('copyEmail')}
                    >
                        {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1 flex-shrink-0">

                {/* === MOBILE LAYOUT (hidden on md and above) === */}
                <div className="flex items-center gap-1 md:hidden">
                    {/* Change Email - icon */}
                    <button
                        onClick={generateAccount}
                        className="btn-ghost p-2"
                        title={t('changeEmail')}
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>

                    {/* Refresh Inbox - icon with badge */}
                    <button
                        onClick={() => { refreshInbox(); if (markAllAsSeen) markAllAsSeen(); }}
                        className="btn-ghost p-2 relative"
                        title={t('refreshNotif')}
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-red-500 rounded-full border-2 border-surface text-white text-[9px] font-bold flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Dark mode toggle */}
                    <button onClick={toggleTheme} className="btn-ghost p-2" title={theme === 'dark' ? t('lightMode') : t('darkMode')}>
                        {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {/* Burger Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className={`btn-ghost p-2 transition-colors ${showMobileMenu ? 'text-primary bg-surfaceHover' : ''}`}
                            title="Menu"
                        >
                            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>

                        {showMobileMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={closeMobileMenu} />
                                <div className="absolute right-0 top-full mt-2 w-52 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                                    {/* Session History */}
                                    <button
                                        onClick={() => { closeMobileMenu(); setTimeout(() => setShowHistory(true), 50); }}
                                        className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-surfaceHover text-textMain transition-colors flex items-center gap-3"
                                    >
                                        <History className="w-4 h-4 text-textMuted" />
                                        {t('sessionHistory')}
                                    </button>

                                    {/* Premium / Profile */}
                                    <button
                                        onClick={() => { onProfileClick(); closeMobileMenu(); }}
                                        className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-surfaceHover text-textMain transition-colors flex items-center gap-3"
                                    >
                                        <User className="w-4 h-4 text-textMuted" />
                                        {t('premiumAccount')}
                                    </button>

                                    <div className="border-t border-border my-1" />

                                    {/* Language heading */}
                                    <div className="px-4 py-2 text-xs font-semibold text-textMuted uppercase tracking-widest flex items-center gap-2">
                                        <Globe className="w-3.5 h-3.5" />
                                        {t('language')}
                                    </div>

                                    {LANGUAGES.map((l) => (
                                        <button
                                            key={l.code}
                                            onClick={() => { setLang(l.code); closeMobileMenu(); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${lang === l.code ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-surfaceHover text-textMain'}`}
                                        >
                                            <span>{l.flag}</span>
                                            {l.name}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* === DESKTOP LAYOUT (hidden below md) === */}
                <div className="hidden md:flex items-center gap-0.5">
                    {/* Change Email */}
                    <button onClick={generateAccount} className="btn-ghost px-3 py-2 text-sm font-semibold whitespace-nowrap">
                        {t('changeEmail')}
                    </button>

                    {/* Language selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLangMenu(!showLangMenu)}
                            className={`btn-ghost px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${showLangMenu ? 'bg-surfaceHover text-primary' : ''}`}
                        >
                            {LANGUAGES.find(l => l.code === lang)?.name || 'Language'}
                        </button>
                        {showLangMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                                <div className="absolute right-0 top-full mt-2 w-40 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
                                    {LANGUAGES.map((l) => (
                                        <button
                                            key={l.code}
                                            onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${lang === l.code ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-surfaceHover text-textMain'}`}
                                        >
                                            <span>{l.flag}</span>
                                            {l.name}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Session History */}
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`btn-ghost px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${showHistory ? 'bg-surfaceHover text-primary' : ''}`}
                    >
                        {t('sessionHistory')}
                    </button>

                    {/* Refresh / Notifications */}
                    <button
                        onClick={() => { refreshInbox(); if (markAllAsSeen) markAllAsSeen(); }}
                        className="btn-ghost px-3 py-2 text-sm font-semibold whitespace-nowrap relative"
                    >
                        {t('refreshNotif').split(' ')[0]}
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-surface text-white text-[10px] font-bold flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Premium / Profile */}
                    <button
                        onClick={onProfileClick}
                        className="btn-ghost px-3 py-2 text-sm font-semibold whitespace-nowrap"
                    >
                        {t('premiumAccount')}
                    </button>

                    {/* Dark mode toggle - always icon */}
                    <button onClick={toggleTheme} className="btn-ghost p-2 ml-1" title={theme === 'dark' ? t('lightMode') : t('darkMode')}>
                        {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* History Dropdown (shared - fixed position from header) */}
            {showHistory && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowHistory(false)} />
                    <div className="absolute right-3 sm:right-5 top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-4 border-b border-border bg-surfaceHover/50">
                            <h3 className="font-bold text-textMain text-sm">{t('recentInboxes')}</h3>
                            <p className="text-xs text-textMuted mt-0.5">{t('recoverPast')}</p>
                        </div>
                        <div className="max-h-64 overflow-y-auto hide-scrollbar p-2">
                            {history.length === 0 ? (
                                <div className="p-4 text-center text-textMuted text-sm">{t('noRecentInboxes')}</div>
                            ) : (
                                history.map((item) => {
                                    const isActive = item.address === account?.address;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                if (!isActive) { recoverAccount(item.address); setShowHistory(false); }
                                            }}
                                            disabled={isActive}
                                            className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${isActive ? 'bg-primary/10 border border-primary/20 cursor-default' : 'hover:bg-surfaceHover border border-transparent'}`}
                                        >
                                            <div className="overflow-hidden pr-2">
                                                <p className={`font-mono font-medium text-sm truncate ${isActive ? 'text-primary' : 'text-textMain'}`}>
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
