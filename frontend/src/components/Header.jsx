import React, { useState } from 'react';
import { Mail, Copy, RefreshCw, Check, Bell, Search, History, ChevronRight, User, Moon, Sun, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../ThemeProvider';
import { useI18n } from '../i18n';

export default function Header({ account, generateAccount, refreshInbox, onLogoClick, history = [], recoverAccount, messages = [], onProfileClick, markAllAsSeen }) {
    const [copied, setCopied] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
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
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
                {/* Change Email */}
                <button
                    onClick={generateAccount}
                    className="hidden sm:flex btn-ghost text-sm px-3 py-2 gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden lg:inline">{t('changeEmail')}</span>
                </button>

                {/* Dark Mode Toggle */}
                <button
                    onClick={toggleTheme}
                    className="btn-ghost p-2"
                    title={theme === 'dark' ? t('lightMode') : t('darkMode')}
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Language Selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        className={`btn-ghost p-2 transition-colors ${showLangMenu ? 'bg-surfaceHover text-primary' : ''}`}
                        title={t('language')}
                    >
                        <Globe className="w-5 h-5" />
                    </button>

                    {showLangMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)}></div>
                            <div className="absolute right-0 top-full mt-2 w-44 dashboard-panel shadow-lg z-50 overflow-hidden text-left origin-top-right p-1.5">
                                {LANGUAGES.map((l) => (
                                    <button
                                        key={l.code}
                                        onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 text-sm transition-colors ${lang === l.code
                                            ? 'bg-primary/10 text-primary font-semibold'
                                            : 'hover:bg-surfaceHover text-textMain'
                                            }`}
                                    >
                                        <span className="text-base">{l.flag}</span>
                                        <span>{l.name}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* History Dropdown */}
                <div className="relative hidden sm:block">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`btn-ghost p-2 transition-colors ${showHistory ? 'bg-surfaceHover text-primary' : ''}`}
                        title={t('sessionHistory')}
                    >
                        <History className="w-5 h-5" />
                    </button>

                    {showHistory && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowHistory(false)}></div>
                            <div className="absolute right-0 top-full mt-2 w-80 dashboard-panel shadow-lg z-50 overflow-hidden text-left origin-top-right">
                                <div className="p-4 border-b border-border bg-surfaceHover/50">
                                    <h3 className="font-bold text-textMain flex items-center gap-2 text-sm">
                                        <History className="w-4 h-4 text-primary" /> {t('recentInboxes')}
                                    </h3>
                                    <p className="text-xs text-textMuted mt-1">{t('recoverPast')}</p>
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
                </div>

                {/* Notifications Bell */}
                <button
                    onClick={() => {
                        refreshInbox();
                        if (markAllAsSeen) markAllAsSeen();
                    }}
                    className="btn-ghost p-2 relative"
                    title={t('refreshNotif')}
                >
                    <Bell className="w-5 h-5" />
                    {messages.filter(m => !m.seen).length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-surface text-white text-[10px] font-bold flex items-center justify-center">
                            {messages.filter(m => !m.seen).length}
                        </span>
                    )}
                </button>

                {/* User Avatar */}
                <button
                    onClick={onProfileClick}
                    className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/30 hover:bg-primary/30 transition-colors cursor-pointer"
                    title={t('premiumAccount')}
                >
                    <User className="w-4 h-4" />
                </button>
            </div>
        </header>
    );
}
