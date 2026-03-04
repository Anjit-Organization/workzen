import api from './api';

export interface Notification {
    _id: string;
    userId: string;
    title: string;
    message: string;
    read: boolean;
    link?: string;
    createdAt: string;
}

export const notificationService = {
    getAll: async (): Promise<Notification[]> => {
        const response = await api.get('/notifications');
        return response.data;
    },

    getUnreadCount: async (): Promise<number> => {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    },

    markAsRead: async (id: string): Promise<Notification> => {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data;
    },

    sendManualNotification: async (data: { title: string, message: string, targetUserId: string, link?: string }) => {
        const response = await api.post('/notifications/manual', data);
        return response.data;
    }
};
