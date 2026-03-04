import api from './api';

export interface DashboardStats {
    totalEmployees: number;
    presentToday: number;
    totalOnLeaveToday: number;
    monthlySalaryCost: number;
    pendingLeavesCount: number;
    recentLeaves: Array<{
        _id: string;
        employeeId: {
            firstName: string;
            lastName: string;
            department: string;
        };
        type: string;
        startDate: string;
        endDate: string;
        status: string;
    }>;
    pendingSalaries: Array<{
        _id: string;
        name: string;
        department: string;
        payroll: number;
        salaryDate: number;
    }>;
    attendanceGraphData?: any[];
}

export const dashboardService = {
    getStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    }
};
