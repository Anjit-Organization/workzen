import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { holidayService, Holiday } from '../services/holidayService';
import { HolidayModal } from '../components/HolidayModal';
import { Calendar, Trash2, Plus, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';

export const Holidays: React.FC = () => {
    const { user } = useAuth();
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchHolidays = async () => {
        setIsLoading(true);
        try {
            const data = await holidayService.getAllHolidays();
            // Sort holidays by date
            const sorted = data.sort((a: Holiday, b: Holiday) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setHolidays(sorted);
        } catch (error) {
            console.error('Failed to fetch holidays:', error);
            toast.error('Failed to load holidays');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this holiday?')) return;
        
        try {
            await holidayService.deleteHoliday(id);
            toast.success('Holiday deleted successfully');
            fetchHolidays();
        } catch (error) {
            console.error('Failed to delete holiday', error);
            toast.error('Failed to delete holiday');
        }
    };

    const canManageHolidays = user?.role !== 'EMPLOYEE';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Holidays</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Company-wide holidays schedule.
                    </p>
                </div>
                {canManageHolidays && (
                    <div className="mt-4 sm:mt-0">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Holiday
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                        <CalendarDays className="w-5 h-5 mr-2 text-purple-600" />
                        All Holidays
                    </h2>
                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
                        {holidays.length} Total
                    </span>
                </div>
                
                {isLoading ? (
                    <div className="p-12 text-center text-slate-500">Loading holidays...</div>
                ) : holidays.length === 0 ? (
                    <div className="p-16 text-center flex flex-col items-center justify-center">
                        <Calendar className="w-16 h-16 text-slate-300 mb-4" />
                        <h3 className="text-xl font-medium text-slate-700">No holidays added yet</h3>
                        <p className="text-slate-500 mt-2 max-w-sm">
                            {canManageHolidays 
                                ? "Click the 'Add Holiday' button above to create a new company holiday."
                                : "There are currently no holidays scheduled."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Holiday</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Day</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    {canManageHolidays && (
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {holidays.map((holiday) => {
                                    const dateObj = new Date(holiday.date);
                                    const dayNumber = dateObj.getDate();
                                    const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' });
                                    const dayStr = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                                    const yearStr = dateObj.getFullYear();
                                    
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const isPast = dateObj < today;

                                    return (
                                        <tr key={holiday._id} className={`transition-colors ${isPast ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Calendar className={`w-4 h-4 mr-2 ${isPast ? 'text-slate-400' : 'text-purple-500'}`} />
                                                    <span className={`text-sm font-medium ${isPast ? 'text-slate-400' : 'text-slate-900'}`}>
                                                        {monthStr} {dayNumber}, {yearStr}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-sm font-semibold ${isPast ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                                    {holiday.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-sm ${isPast ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {dayStr}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isPast ? 'bg-slate-100 text-slate-600' : 'bg-purple-100 text-purple-700'}`}>
                                                    {isPast ? 'Past' : 'Upcoming'}
                                                </span>
                                            </td>
                                            {canManageHolidays && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleDelete(holiday._id)}
                                                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                                                        title="Delete Holiday"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <HolidayModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={fetchHolidays} 
            />
        </div>
    );
};
