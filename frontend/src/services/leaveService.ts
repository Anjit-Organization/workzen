import api from './api';

export interface Leave {
    _id: string;
    employeeId: {
        _id: string;
        firstName: string;
        lastName: string;
        department: string;
    } | string;
    type: 'CASUAL' | 'SICK' | 'PRIVILEGE';
    startDate: string;
    endDate: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedBy?: {
        firstName: string;
        lastName: string;
    };
    createdAt: string;
}

export interface LeaveBalance {
    casualLeave: number;
    sickLeave: number;
    privilegeLeave: number;
}

export const leaveService = {
    applyLeave: async (data: { type: string, startDate: string, endDate: string, reason: string }) => {
        const response = await api.post(`/leaves/apply`, data);
        return response.data;
    },

    getBalance: async (): Promise<LeaveBalance> => {
        const response = await api.get(`/leaves/balance`);
        return response.data;
    },

    getAllLeaves: async (params?: { employeeId?: string, status?: string, page?: number, limit?: number }) => {
        const response = await api.get('/leaves', { params });
        return response.data;
    },

    updateStatus: async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
        const response = await api.put(`/leaves/${leaveId}/status`, { status });
        return response.data;
    }
};
