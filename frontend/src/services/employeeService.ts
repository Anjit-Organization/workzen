import api from './api';

export interface Employee {
    _id: string;
    employeeId?: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    designation: string;
    joiningDate: string;
    payroll: number;
    salaryDate: number;
    lastSalaryPaidDate?: string;
    casualLeaveQuota: number;
    sickLeaveQuota: number;
    privilegeLeaveQuota: number;
    status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
    userId?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export const employeeService = {
    getAll: async (params: { page?: number; limit?: number; search?: string }) => {
        const response = await api.get('/employees', { params });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/employees/${id}`);
        return response.data;
    },

    create: async (data: Omit<Employee, '_id' | 'status' | 'userId'>) => {
        const response = await api.post('/employees', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Employee>) => {
        const response = await api.patch(`/employees/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/employees/${id}`);
        return response.data;
    },

    markSalaryPaid: async (id: string) => {
        const response = await api.patch(`/employees/${id}/mark-salary-paid`);
        return response.data;
    },
};
