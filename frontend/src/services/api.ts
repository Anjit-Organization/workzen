import axios from 'axios';

import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://workzen-ahpg.onrender.com',
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        // We can optionally show success toasts here, but usually best done at the component level
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Show universal toast
        const message = error.response?.data?.message;
        if (message && originalRequest.url !== '/auth/login') { // Avoid double toasting on login page if it handles it
            if (Array.isArray(message)) {
                toast.error(message[0]);
            } else {
                toast.error(message);
            }
        } else if (!message && error.response?.status !== 401) {
            toast.error('An unexpected error occurred. Please try again.');
        }

        // Add logic here later for handling refresh tokens securely
        // But for MVP, let's just logout if 401
        if (error.response?.status === 401 && !originalRequest._retry) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
