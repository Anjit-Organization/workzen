import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { attendanceService, AttendanceRecord, AttendanceCorrection } from '../services/attendanceService';
import { Calendar, Clock, User as UserIcon, Check, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const Attendance: React.FC = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'register' | 'corrections'>('register');
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    const fetchAttendance = async () => {
        setIsLoading(true);
        try {
            const data = await attendanceService.getAll(selectedDate);
            setRecords(data);
        } catch (error) {
            console.error('Failed to fetch attendance records', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCorrections = async () => {
        setIsLoading(true);
        try {
            const data = await attendanceService.getAllPendingCorrections();
            setCorrections(data);
        } catch (error) {
            console.error('Failed to fetch corrections', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role !== 'EMPLOYEE') {
            if (activeTab === 'register') {
                fetchAttendance();
            } else {
                fetchCorrections();
            }
        }
    }, [selectedDate, user, activeTab]);

    const handleResolve = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            await attendanceService.resolveCorrection(id, { status });
            toast.success(`Correction ${status.toLowerCase()} successfully`);
            fetchCorrections();
        } catch (error) {
            console.error('Failed to resolve correction', error);
        }
    };

    const formatTime = (timeString?: string) => {
        if (!timeString) return '--:--';
        return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (ms?: number) => {
        if (!ms) return '--';
        const totalSeconds = Math.floor(ms / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    if (user?.role === 'EMPLOYEE') {
        return <div className="p-8 text-center text-slate-500">Access Denied</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance Administration</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage daily registers and correction requests.
                    </p>
                </div>
                {activeTab === 'register' && (
                    <div className="mt-4 sm:mt-0">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                )}
            </div>

            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('register')}
                    className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'register' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    Daily Register
                </button>
                <button
                    onClick={() => setActiveTab('corrections')}
                    className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'corrections' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    Pending Corrections
                    {corrections.length > 0 && activeTab === 'register' && (
                        <span className="ml-2 bg-indigo-100 text-indigo-600 py-0.5 px-2.5 rounded-full text-xs">
                            {corrections.length}
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'register' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Employee
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Punch In
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Punch Out
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Time
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            Loading attendance...
                                        </td>
                                    </tr>
                                ) : records.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                            <p>No attendance records found for this date.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((record) => (
                                        <tr key={record._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium border border-slate-200">
                                                        {typeof record.userId !== 'string' ? record.userId.firstName?.charAt(0) : <UserIcon className="w-4 h-4" />}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {typeof record.userId !== 'string' ? `${record.userId.firstName} ${record.userId.lastName}` : 'Unknown'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {typeof record.userId !== 'string' && record.userId.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {record.date}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex items-center">
                                                    <Clock className="w-3 h-3 mr-1 text-emerald-500" />
                                                    {formatTime(record.records && record.records.length > 0 ? record.records[0].punchIn : undefined)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex items-center">
                                                    {record.records && record.records.length > 0 && record.records[record.records.length - 1].punchOut ? (
                                                        <>
                                                            <Clock className="w-3 h-3 mr-1 text-rose-500" />
                                                            {formatTime(record.records[record.records.length - 1].punchOut)}
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-xs ml-4">In Progress</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                                                {formatDuration(record.durationMs)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {(() => {
                                                    const isWorking = record.records && record.records.length > 0 && !record.records[record.records.length - 1].punchOut;
                                                    return (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isWorking ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                                            {isWorking ? 'Working' : 'Completed Shift'}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Times</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading corrections...</td>
                                    </tr>
                                ) : corrections.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                            <p>No pending corrections.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    corrections.map((corr) => (
                                        <tr key={corr._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{typeof corr.userId !== 'string' ? `${corr.userId.firstName} ${corr.userId.lastName}` : 'Unknown'}</div>
                                                <div className="text-xs text-gray-500">{typeof corr.userId !== 'string' && corr.userId.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{corr.date}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={corr.reason}>{corr.reason}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex flex-col space-y-1">
                                                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1 text-emerald-500" /> {formatTime(corr.correctedPunchIn)}</span>
                                                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1 text-rose-500" /> {formatTime(corr.correctedPunchOut)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleResolve(corr._id, 'APPROVED')} className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg mr-2 transition-colors" title="Approve">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleResolve(corr._id, 'REJECTED')} className="text-rose-600 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 p-2 rounded-lg transition-colors" title="Reject">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
