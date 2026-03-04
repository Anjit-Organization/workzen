import api from './api';

export interface AttendanceStatus {
    punchedIn: boolean;
    punchInTime: string | null;
    todayDuration: number;
}

export interface AttendanceRecord {
    _id: string;
    userId: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    } | string;
    date: string;
    records: {
        punchIn: string;
        punchOut?: string;
    }[];
    durationMs?: number;
    isAbsent?: boolean;
}

export interface AttendanceCorrection {
    _id: string;
    userId: any;
    attendanceId: any;
    date: string;
    reason: string;
    correctedPunchIn: string;
    correctedPunchOut: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    hrComments?: string;
    createdAt: string;
}

export const attendanceService = {
    getStatus: async (): Promise<AttendanceStatus> => {
        const response = await api.get('/attendance/status');
        const data = response.data;
        return {
            punchedIn: data.isCheckedIn,
            punchInTime: data.punchInTime,
            todayDuration: Math.floor((data.durationMs || 0) / 1000)
        };
    },

    punchIn: async () => {
        const response = await api.post('/attendance/punch-in');
        return response.data;
    },

    punchOut: async () => {
        const response = await api.post('/attendance/punch-out');
        return response.data;
    },

    getHistory: async (): Promise<AttendanceRecord[]> => {
        const response = await api.get('/attendance/history');
        return response.data;
    },

    getAll: async (date?: string): Promise<AttendanceRecord[]> => {
        const response = await api.get('/attendance', { params: { date } });
        return response.data;
    },

    submitCorrection: async (data: { attendanceId: string, date: string, reason: string, correctedPunchIn: string, correctedPunchOut: string }) => {
        const response = await api.post('/attendance/correction', data);
        return response.data;
    },

    getMyCorrections: async (): Promise<AttendanceCorrection[]> => {
        const response = await api.get('/attendance/correction');
        return response.data;
    },

    getAllPendingCorrections: async (): Promise<AttendanceCorrection[]> => {
        const response = await api.get('/attendance/correction/all');
        return response.data;
    },

    resolveCorrection: async (id: string, data: { status: 'APPROVED' | 'REJECTED', hrComments?: string }) => {
        const response = await api.patch(`/attendance/correction/${id}/resolve`, data);
        return response.data;
    }
};
