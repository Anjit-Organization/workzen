import React, { useState, useEffect } from 'react';
import { leaveService } from '../services/leaveService';
import { useAuth } from '../contexts/AuthContext';
import { holidayService, Holiday } from '../services/holidayService';
import toast from 'react-hot-toast';

interface ApplyLeaveFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export const ApplyLeaveForm: React.FC<ApplyLeaveFormProps> = ({ onSuccess, onCancel }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        type: 'CASUAL',
        startDate: '',
        endDate: '',
        reason: ''
    });
    const [error, setError] = useState<React.ReactNode>('');
    const [isLoading, setIsLoading] = useState(false);
    const [holidays, setHolidays] = useState<Holiday[]>([]);

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const data = await holidayService.getAllHolidays();
                setHolidays(data);
            } catch (err) {
                console.error("Failed to fetch holidays", err);
            }
        };
        fetchHolidays();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);

            if (start > end) {
                setError('Start date cannot be after end date.');
                setIsLoading(false);
                return;
            }

            const currentDate = new Date(start);
            while (currentDate <= end) {
                const dayOfWeek = currentDate.getDay();
                
                let suggestion = 'Please change your leave dates.';
                if (currentDate.getTime() === start.getTime() && start.getTime() === end.getTime()) {
                    suggestion = 'Please change your selected date.';
                } else if (currentDate.getTime() === start.getTime()) {
                    suggestion = 'Please change your start date.';
                } else if (currentDate.getTime() === end.getTime()) {
                    suggestion = 'Please change your end date.';
                } else {
                    suggestion = 'Please adjust your start or end date to exclude this day.';
                }

                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    const dayName = dayOfWeek === 0 ? 'Sunday' : 'Saturday';
                    const formattedDate = currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                    const msg = (
                        <span>
                            Your selected dates include a weekend (<strong className="font-semibold text-red-800">{dayName}, {formattedDate}</strong>). {suggestion}
                        </span>
                    );
                    setError(msg);
                    setIsLoading(false);
                    return;
                }

                const matchingHoliday = holidays.find(h => {
                    const hDate = new Date(h.date);
                    return hDate.getFullYear() === currentDate.getFullYear() &&
                           hDate.getMonth() === currentDate.getMonth() &&
                           hDate.getDate() === currentDate.getDate();
                });

                if (matchingHoliday) {
                    const formattedDate = currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                    const msg = (
                        <span>
                            Your selected dates include a company holiday: <strong className="font-semibold text-red-800">{matchingHoliday.name} on {formattedDate}</strong>. {suggestion}
                        </span>
                    );
                    setError(msg);
                    setIsLoading(false);
                    return;
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        try {
            await leaveService.applyLeave(formData);
            toast.success('Leave applied successfully');
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to apply for leave. Please check your balance.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6">
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
                    <select
                        name="type"
                        required
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="CASUAL">Casual Leave</option>
                        <option value="SICK">Sick Leave</option>
                        <option value="PRIVILEGE">Privilege Leave</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            required
                            value={formData.startDate}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            required
                            value={formData.endDate}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                    <textarea
                        name="reason"
                        required
                        rows={3}
                        value={formData.reason}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Please provide a reason for your leave..."
                    />
                </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Submitting...' : 'Apply Leave'}
                </button>
            </div>
        </form>
    );
};
