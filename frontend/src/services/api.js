import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
});

// Attach JWT token to premium requests automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('premium_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses (expired tokens)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && error.response?.data?.detail?.includes('expired')) {
            localStorage.removeItem('premium_token');
            localStorage.removeItem('premium_user');
            localStorage.removeItem('premium_email');
        }
        return Promise.reject(error);
    }
);
