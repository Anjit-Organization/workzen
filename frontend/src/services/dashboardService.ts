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
            name: string;
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
    idleUsers?: Array<{
        _id: string;
        name: string;
        department: string;
        designation: string;
        role: string;
    }>;

    attendanceGraphData?: any[];

}

export const dashboardService = {
    getStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },
    getMonthlyAttendance: async (month: number, year: number): Promise<{ graphData: any[]; totalEmployees: number }> => {
        const response = await api.get('/dashboard/monthly-attendance', { params: { month, year } });
        return response.data;
    }
};
