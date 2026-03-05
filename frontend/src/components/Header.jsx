import React, { useState } from 'react';
import { Mail, Copy, RefreshCw, Check, Bell, Search, History, ChevronRight, User, Moon, Sun, Globe, Menu } from 'lucide-react';
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

    const handleCopy = () => {
        if (account?.address) {
            navigator.clipboard.writeText(account.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <header className="bg-surface border-b border-border px-3 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
            {/* Left: Logo */}
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0" onClick={onLogoClick}>
                <div className="bg-primary p-1.5 rounded-lg">
                    <Mail className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-textMain tracking-tight hidden sm:block">
                    TempyMail
                </h1>
            </div>

            {/* Middle: Email address bar */}
            <div className="flex flex-1 max-w-lg mx-2 sm:mx-6">
                <div className="relative w-full flex items-center">
                    <div className="absolute left-3 text-textMuted">
                        <Search className="w-4 h-4" />
                    </div>
                    <div className="w-full bg-surfaceHover border border-border rounded-lg py-2 pl-10 pr-12 text-xs sm:text-sm text-textMain font-mono font-medium truncate">
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

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Mobile Important Actions (hidden on lg) */}
                <div className="flex items-center gap-0.5 md:gap-1 lg:hidden">
                    <button
                        onClick={generateAccount}
                        className="btn-ghost p-1.5 sm:p-2 relative group"
                        title={t('changeEmail')}
                    >
                        <RefreshCw className="w-5 h-5 text-textMain group-hover:text-primary transition-colors" />
                    </button>
                    <button
                        onClick={() => {
                            refreshInbox();
                            if (markAllAsSeen) markAllAsSeen();
                        }}
                        className="btn-ghost p-1.5 sm:p-2 relative group"
                        title={t('refreshNotif')}
                    >
                        <Bell className="w-5 h-5 text-textMain group-hover:text-primary transition-colors" />
                        {messages.filter(m => !m.seen).length > 0 && (
                            <span className="absolute -top-0.5 right-0 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-surface text-white text-[10px] font-bold flex items-center justify-center">
                                {messages.filter(m => !m.seen).length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Dark Mode Toggle - always icon */}
                <button
                    onClick={toggleTheme}
                    className="btn-ghost p-2"
                    title={theme === 'dark' ? t('lightMode') : t('darkMode')}
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Desktop Actions (hidden on lg and below) */}
                <div className="hidden lg:flex items-center gap-1 xl:gap-2">
                    {/* Change Email */}
                    <button onClick={generateAccount} className="btn-ghost text-sm px-3 py-2 font-semibold">
                        {t('changeEmail')}
                    </button>

                    {/* Language Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLangMenu(!showLangMenu)}
                            className={`btn-ghost px-3 py-2 text-sm font-semibold transition-colors ${showLangMenu ? 'bg-surfaceHover text-primary' : ''}`}
                        >
                            {LANGUAGES.find(l => l.code === lang)?.name}
                        </button>
                        {showLangMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-44 dashboard-panel shadow-lg z-50 overflow-hidden text-left origin-top-right p-1.5 border border-border/40">
                                    {LANGUAGES.map((l) => (
                                        <button
                                            key={l.code}
                                            onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${lang === l.code ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-surfaceHover text-textMain'}`}
                                        >
                                            {l.name}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* History Button */}
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`btn-ghost px-3 py-2 text-sm font-semibold transition-colors ${showHistory ? 'bg-surfaceHover text-primary' : ''}`}
                    >
                        {t('sessionHistory')}
                    </button>

                    {/* Notifications */}
                    <button
                        onClick={() => {
                            refreshInbox();
                            if (markAllAsSeen) markAllAsSeen();
                        }}
                        className="btn-ghost px-3 py-2 text-sm font-semibold relative"
                    >
                        {t('refreshNotif').split(' ')[0]}
                        {messages.filter(m => !m.seen).length > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-red-500 rounded-full border-2 border-surface text-white text-[10px] font-bold flex items-center justify-center">
                                {messages.filter(m => !m.seen).length}
                            </span>
                        )}
                    </button>

                    {/* User/Premium */}
                    <button
                        onClick={onProfileClick}
                        className="btn-ghost px-3 py-2 text-sm font-semibold"
                    >
                        {t('premiumAccount')}
                    </button>
                </div>

                {/* Mobile Menu Toggle (lg and below) */}
                <div className="relative lg:hidden">
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className={`btn-ghost p-1.5 sm:p-2 transition-colors ${showMobileMenu ? 'bg-surfaceHover text-primary' : ''}`}
                        title="Menu"
                    >
                        <Menu className="w-6 h-6 text-textMain" />
                    </button>

                    {showMobileMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
                            <div className="absolute right-0 top-full mt-2 w-56 dashboard-panel shadow-xl z-50 overflow-hidden text-left origin-top-right py-2 border border-border flex flex-col">
                                <button
                                    onClick={() => {
                                        setShowMobileMenu(false);
                                        setTimeout(() => setShowHistory(true), 10);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-surfaceHover text-textMain transition-colors flex items-center gap-2"
                                >
                                    <History className="w-4 h-4" />
                                    {t('sessionHistory')}
                                </button>

                                <button
                                    onClick={() => { onProfileClick(); setShowMobileMenu(false); }}
                                    className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-surfaceHover text-textMain transition-colors border-b border-border/50 pb-4 flex items-center gap-2"
                                >
                                    <User className="w-4 h-4" />
                                    {t('premiumAccount')}
                                </button>

                                {/* Languages inside Mobile Menu */}
                                <div className="px-4 py-2 mt-2 text-xs font-bold text-textMuted uppercase tracking-wider">
                                    {t('language')}
                                </div>
                                {LANGUAGES.map((l) => (
                                    <button
                                        key={l.code}
                                        onClick={() => { setLang(l.code); setShowMobileMenu(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${lang === l.code ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-surfaceHover text-textMain font-medium'}`}
                                    >
                                        {l.name}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* History Dropdown (Shared for Mobile and Desktop) */}
            {showHistory && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowHistory(false)}></div>
                    <div className="absolute right-3 sm:right-6 top-16 mt-1 w-80 dashboard-panel shadow-xl z-50 overflow-hidden text-left origin-top-right border border-border">
                        <div className="p-4 border-b border-border bg-surfaceHover/50">
                            <h3 className="font-bold text-textMain text-sm mb-1">{t('recentInboxes')}</h3>
                            <p className="text-xs text-textMuted">{t('recoverPast')}</p>
                        </div>
                        <div className="max-h-64 overflow-y-auto hide-scrollbar p-2">
                            {history.length === 0 ? (
                                <div className="p-4 text-center text-textMuted text-sm">
                                    {t('noRecentInboxes')}
                                </div>
                            ) : (
                                history.map((item) => {
                                    const isActive = item.address === account?.address;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                if (!isActive) {
                                                    recoverAccount(item.address);
                                                    setShowHistory(false);
                                                }
                                            }}
                                            disabled={isActive}
                                            className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${isActive
                                                ? 'bg-primary/10 border border-primary/20 cursor-default'
                                                : 'hover:bg-surfaceHover border border-transparent'
                                                }`}
                                        >
                                            <div className="overflow-hidden pr-2">
                                                <p className={`font-mono font-medium text-sm truncate ${isActive ? 'text-primary' : 'text-textMain'}`}>
                                                    {item.address}
                                                </p>
                                                <p className="text-xs text-textMuted mt-1">
                                                    {isActive ? t('currentSession') : formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                            {!isActive && <ChevronRight className="w-4 h-4 text-textMuted" />}
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </header>
    );
}
