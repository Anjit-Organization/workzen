import api from './api';

export interface Holiday {
    _id: string;
    name: string;
    date: string;
    organizationId: string;
}

export const holidayService = {
    getAllHolidays: async () => {
        const response = await api.get('/holidays');
        return response.data;
    },

    addHoliday: async (data: { name: string; date: string }) => {
        const response = await api.post('/holidays', data);
        return response.data;
    },

    deleteHoliday: async (id: string) => {
        const response = await api.delete(`/holidays/${id}`);
        return response.data;
    }
};
