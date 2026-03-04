import api from './api';

export interface Task {
    _id: string;
    title: string;
    description: string;
    projectId: any;
    organizationId: string;
    assigneeId: any;
    createdBy: any;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CLOSED';
    deadline?: string;
    createdAt: string;
}

export const taskService = {
    getAll: async (projectId?: string, userId?: string, status?: string) => {
        const params: any = {};
        if (projectId) params.projectId = projectId;
        if (userId) params.userId = userId;
        if (status) params.status = status;
        const response = await api.get('/tasks', { params });
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/tasks/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/tasks', data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.patch(`/tasks/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/tasks/${id}`);
        return response.data;
    },
};
