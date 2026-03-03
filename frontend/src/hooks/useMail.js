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
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.post('/accounts');
            localStorage.setItem('mail_address', data.address);
            localStorage.setItem('mail_id', data.id);

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
            setMessages(data.messages || []);
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
            const { data } = await api.get(`/messages/${id}`);
            setSelectedMessage(data);
        } catch (err) {
            console.error('Failed to load message details', err);
        } finally {
            setLoading(false);
        }
    };

    // Delete a message
    const deleteMessage = async (id) => {
        try {
            await api.delete(`/messages/${id}`);
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
        recoverAccount
    };
};
