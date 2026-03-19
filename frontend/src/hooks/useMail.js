import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export const useMail = () => {
    const [account, setAccount] = useState(null);
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [started, setStarted] = useState(false);
    const [history, setHistory] = useState([]);
    const [seenMessageIds, setSeenMessageIds] = useState([]);

    // Load history on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('mail_history');
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error('Failed to parse history');
            }
        }
    }, []);

    // Generate a new random address
    const generateAccount = useCallback(async () => {
        // Check daily limit from localStorage (premium users bypass)
        const premiumEmail = localStorage.getItem('premium_email');
        const today = new Date().toISOString().split('T')[0];
        const limitData = JSON.parse(localStorage.getItem('daily_limit') || '{}');
        const todayCount = limitData.date === today ? limitData.count : 0;

        if (!premiumEmail && todayCount >= 3) {
            setError('Daily limit reached (3 free emails/day). Upgrade to Premium for unlimited emails!');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Get reCAPTCHA v3 token (invisible)
            let recaptchaToken = '';
            try {
                recaptchaToken = await new Promise((resolve, reject) => {
                    if (window.grecaptcha) {
                        window.grecaptcha.ready(() => {
                            window.grecaptcha
                                .execute('6Ler9YAsAAAAALRZZwFXk0vem0bPneA3__mAxzcZ', { action: 'create_account' })
                                .then(resolve)
                                .catch(reject);
                        });
                    } else {
                        resolve(''); // Allow if reCAPTCHA not loaded (dev mode)
                    }
                });
            } catch (e) {
                console.warn('reCAPTCHA failed, proceeding without token');
            }

            const { data } = await api.post('/accounts', { recaptcha_token: recaptchaToken });
            localStorage.setItem('mail_address', data.address);
            localStorage.setItem('mail_id', data.id);

            // Update daily limit counter
            localStorage.setItem('daily_limit', JSON.stringify({ date: today, count: todayCount + 1 }));

            // Save to history (keep last 5)
            const newHistoryItem = {
                id: data.id,
                address: data.address,
                createdAt: new Date().toISOString()
            };

            const updatedHistory = [newHistoryItem, ...history.filter(h => h.address !== data.address)].slice(0, 5);
            setHistory(updatedHistory);
            localStorage.setItem('mail_history', JSON.stringify(updatedHistory));

            setAccount(data);
            setMessages([]);
            setSelectedMessage(null);
            setSeenMessageIds([]);
            localStorage.removeItem(`seen_${data.address}`);
            setStarted(true);
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Failed to generate account');
        } finally {
            setLoading(false);
        }
    }, [history]);

    // Restore saved address from localStorage
    const restoreAccount = useCallback(() => {
        const address = localStorage.getItem('mail_address');
        const id = localStorage.getItem('mail_id');

        if (address && id) {
            setAccount({ address, id });
            setStarted(true);
            return true;
        }
        return false;
    }, []);

    // Recover an old address from history (no auth needed anymore!)
    const recoverAccount = async (address) => {
        setLoading(true);
        setError(null);
        try {
            localStorage.setItem('mail_address', address);
            setAccount({ address, id: address });
            setMessages([]);
            setSelectedMessage(null);
            setStarted(true);
            return true;
        } catch (err) {
            setError('Failed to recover account.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Fetch inbox messages by address
    const fetchMessages = useCallback(async () => {
        if (!account?.address) return;
        try {
            const { data } = await api.get('/messages', { params: { address: account.address } });
            // Merge local seen state (scoped per address)
            const currentSeen = JSON.parse(localStorage.getItem(`seen_${account.address}`) || '[]');
            setMessages((data.messages || []).map(m => ({
                ...m,
                seen: currentSeen.includes(m.id)
            })));
        } catch (err) {
            console.error('Failed to fetch messages', err);
        }
    }, [account]);

    // Manually refresh inbox
    const refreshInbox = useCallback(async () => {
        setLoading(true);
        await fetchMessages();
        setLoading(false);
    }, [fetchMessages]);

    // Get single message details
    const getMessageDetails = async (id) => {
        try {
            setLoading(true);
            const { data } = await api.get(`/messages/${id}`, { params: { address: account?.address } });
            setSelectedMessage(data);

            // Mark as seen (scoped per address)
            setSeenMessageIds(prev => {
                const next = [...new Set([...prev, id])];
                if (account?.address) {
                    localStorage.setItem(`seen_${account.address}`, JSON.stringify(next));
                }
                return next;
            });
            setMessages(prev => prev.map(m => m.id === id ? { ...m, seen: true } : m));
        } catch (err) {
            console.error('Failed to load message details', err);
        } finally {
            setLoading(false);
        }
    };

    // Mark all as seen
    const markAllAsSeen = useCallback(() => {
        setMessages(prev => {
            const allIds = prev.map(m => m.id);
            setSeenMessageIds(prevSeen => {
                const next = [...new Set([...prevSeen, ...allIds])];
                if (account?.address) {
                    localStorage.setItem(`seen_${account.address}`, JSON.stringify(next));
                }
                return next;
            });
            return prev.map(m => ({ ...m, seen: true }));
        });
    }, [account]);

    // Delete a message
    const deleteMessage = async (id) => {
        try {
            await api.delete(`/messages/${id}`, { params: { address: account?.address } });
            if (selectedMessage?.id === id) {
                setSelectedMessage(null);
            }
            await fetchMessages();
        } catch (err) {
            console.error('Failed to delete message', err);
        }
    };

    // On mount, try to restore a saved session
    useEffect(() => {
        restoreAccount();
    }, [restoreAccount]);

    // Poll for messages every 2 seconds when account exists
    useEffect(() => {
        let interval;
        if (account) {
            fetchMessages();
            interval = setInterval(fetchMessages, 2000);
        }
        return () => clearInterval(interval);
    }, [account, fetchMessages]);

    const goHome = () => {
        setStarted(false);
    };

    return {
        account,
        messages,
        selectedMessage,
        loading,
        error,
        started,
        generateAccount,
        refreshInbox,
        getMessageDetails,
        deleteMessage,
        setSelectedMessage,
        goHome,
        history,
        recoverAccount,
        markAllAsSeen,
        clearError: () => setError(null)
    };
};
