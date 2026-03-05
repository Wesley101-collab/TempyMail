import React, { useState } from 'react';
import { Mail, Copy, RefreshCw, Check, Bell, History, ChevronRight, User, Moon, Sun } from 'lucide-react';
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

    const unseenCount = messages.filter(m => !m.seen).length;

    return (
        <header className="bg-surface border-b border-border px-2 sm:px-4 md:px-6 py-2.5 sticky top-0 z-50 w-full overflow-x-hidden">
            <div className="flex items-center justify-between gap-2 max-w-full">
                {/* Left: Logo */}
                <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0" onClick={onLogoClick}>
                    <div className="bg-primary p-1.5 rounded-lg">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <h1 className="text-base sm:text-lg md:text-xl font-bold text-textMain tracking-tight">
                        TempyMail
                    </h1>
                </div>

                {/* Middle: Email address */}
                <div className="flex flex-1 min-w-0 mx-1 sm:mx-3 md:mx-6 max-w-lg">
                    <div className="relative w-full flex items-center min-w-0">
                        <div className="w-full bg-surfaceHover border border-border rounded-lg py-1.5 sm:py-2 px-3 pr-10 text-xs sm:text-sm text-textMain font-mono font-medium truncate min-w-0">
                            {account?.address || t('generatingAddress')}
                        </div>
                        <button
                            onClick={handleCopy}
                            className="absolute right-1.5 p-1 text-textMuted hover:text-primary rounded-md transition-colors"
                            title={t('copyEmail')}
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">

                    {/* Change Email */}
                    <button
                        onClick={generateAccount}
                        className="btn-ghost p-1.5 sm:p-2"
                        title={t('changeEmail')}
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="btn-ghost p-1.5 sm:p-2"
                        title={theme === 'dark' ? t('lightMode') : t('darkMode')}
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>

                    {/* Language */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLangMenu(!showLangMenu)}
                            className={`btn-ghost p-1.5 sm:p-2 transition-colors ${showLangMenu ? 'bg-surfaceHover text-primary' : ''}`}
                            title={t('language')}
                        >
                            <span className="text-sm sm:text-base">{LANGUAGES.find(l => l.code === lang)?.flag}</span>
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

                    {/* History */}
                    <div className="relative hidden sm:block">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={`btn-ghost p-2 transition-colors ${showHistory ? 'bg-surfaceHover text-primary' : ''}`}
                            title={t('sessionHistory')}
                        >
                            <History className="w-4 h-4" />
                        </button>

                        {showHistory && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowHistory(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 dashboard-panel shadow-lg z-50 overflow-hidden text-left origin-top-right">
                                    <div className="p-3 sm:p-4 border-b border-border bg-surfaceHover/50">
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

                    {/* Notifications */}
                    <button
                        onClick={() => {
                            refreshInbox();
                            if (markAllAsSeen) markAllAsSeen();
                        }}
                        className="btn-ghost p-1.5 sm:p-2 relative"
                        title={t('refreshNotif')}
                    >
                        <Bell className="w-4 h-4" />
                        {unseenCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-red-500 rounded-full border-2 border-surface text-white text-[9px] font-bold flex items-center justify-center">
                                {unseenCount}
                            </span>
                        )}
                    </button>

                    {/* User */}
                    <button
                        onClick={onProfileClick}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary overflow-hidden border border-primary/30 hover:bg-primary/30 transition-colors flex-shrink-0"
                        title={t('premiumAccount')}
                    >
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                </div>
            </div>
        </header>
    );
}
