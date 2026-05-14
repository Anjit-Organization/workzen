import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { attendanceService, AttendanceRecord, AttendanceCorrection } from '../services/attendanceService';
import { employeeService, Employee } from '../services/employeeService';
import { Calendar, Clock, User as UserIcon, Check, X, AlertCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export const Attendance: React.FC = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'register' | 'corrections' | 'monthly'>('register');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [selectedEmployee, setSelectedEmployee] = useState<{ id: string, name: string } | null>(null);
    const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);

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

    const fetchEmployees = async () => {
        try {
            const data = await employeeService.getAll({ limit: 100 });
            setEmployees(data.data || []);
        } catch (error) {
            console.error('Failed to fetch employees', error);
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

    const fetchMonthlyAttendance = async (userId: string, month: string) => {
        setIsMonthlyLoading(true);
        try {
            const data = await attendanceService.getMonthlyByUser(userId, month);
            
            // Generate all days for the selected month
            const [year, mon] = month.split('-').map(Number);
            const daysInMonth = new Date(year, mon, 0).getDate();
            const allDays: AttendanceRecord[] = [];
            
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            for (let i = 1; i <= daysInMonth; i++) {
                const dayStr = `${month}-${String(i).padStart(2, '0')}`;
                
                // Skip future dates
                if (dayStr > todayStr) continue;

                const existingRecord = data.find(r => r.date === dayStr);
                
                if (existingRecord) {
                    allDays.push(existingRecord);
                } else {
                    // Create a dummy "Absent" record for the UI
                    allDays.push({
                        _id: `absent-${dayStr}`,
                        userId: userId,
                        date: dayStr,
                        records: [],
                        durationMs: 0,
                        isAbsent: true
                    } as any);
                }
            }
            
            setMonthlyRecords(allDays);
        } catch (error) {
            console.error('Failed to fetch monthly attendance', error);
            toast.error('Failed to fetch monthly attendance');
        } finally {
            setIsMonthlyLoading(false);
        }
    };

    const handleEmployeeClick = (id: string, name: string) => {
        setSelectedEmployee({ id, name });
        setActiveTab('monthly');
        fetchMonthlyAttendance(id, selectedMonth);
    };

    useEffect(() => {
        if (selectedEmployee && selectedEmployee.id) {
            fetchMonthlyAttendance(selectedEmployee.id, selectedMonth);
        }
    }, [selectedMonth, selectedEmployee]);

    useEffect(() => {
        if (user?.role !== 'EMPLOYEE') {
            fetchEmployees();
        }
    }, [user]);

    useEffect(() => {
        if (user?.role !== 'EMPLOYEE') {
            if (activeTab === 'register') {
                fetchAttendance();
            } else if (activeTab === 'corrections') {
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
                    {corrections.length > 0 && activeTab !== 'corrections' && (
                        <span className="ml-2 bg-indigo-100 text-indigo-600 py-0.5 px-2.5 rounded-full text-xs">
                            {corrections.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('monthly')}
                    className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'monthly' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    Monthly Attendance
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
                                        <tr 
                                            key={record._id} 
                                            className="hover:bg-indigo-50 cursor-pointer transition-colors"
                                            onClick={() => {
                                                const empName = typeof record.userId !== 'string' ? `${record.userId.firstName} ${record.userId.lastName}` : 'Unknown';
                                                const empId = typeof record.userId !== 'string' ? record.userId._id : record.userId;
                                                handleEmployeeClick(empId, empName);
                                            }}
                                        >
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
            ) : activeTab === 'corrections' ? (
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
            ) : (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Employee</label>
                                <div className="relative">
                                    <select 
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none text-slate-700 font-medium cursor-pointer transition-all hover:bg-slate-100"
                                        value={selectedEmployee?.id || ''}
                                        onChange={(e) => {
                                            const userId = e.target.value;
                                            const emp = employees.find(emp => {
                                                const empUserId = typeof emp.userId === 'object' ? emp.userId?._id : emp.userId;
                                                return empUserId === userId;
                                            });
                                            if (emp) {
                                                setSelectedEmployee({ id: userId, name: emp.name });
                                            } else {
                                                setSelectedEmployee(null);
                                            }
                                        }}
                                    >
                                        <option value="">Choose an employee...</option>
                                        {employees.map(emp => {
                                            const userId = typeof emp.userId === 'object' ? emp.userId?._id : emp.userId;
                                            return (
                                                <option key={emp._id} value={userId || ''}>
                                                    {emp.name} ({emp.department})
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Month</label>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 font-medium cursor-pointer transition-all hover:bg-slate-100"
                                />
                            </div>
                        </div>
                    </div>

                    {selectedEmployee ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center">
                                    <UserIcon className="w-5 h-5 mr-2 text-indigo-500" />
                                    Monthly Log: <span className="text-indigo-600 ml-2">{selectedEmployee.name}</span>
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">Detailed attendance records for {new Date(selectedMonth).toLocaleDateString('default', { month: 'long', year: 'numeric' })}</p>
                            </div>

                            <div className="p-6">
                                {isMonthlyLoading ? (
                                    <div className="py-20 text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                                        <p className="mt-4 text-slate-500">Fetching records...</p>
                                    </div>
                                ) : monthlyRecords.length === 0 ? (
                                    <div className="py-16 text-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                                        <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                        <p className="text-slate-500 font-medium">No records found for this month.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {monthlyRecords.map((rec) => {
                                            const isPresent = rec.durationMs && rec.durationMs > 0;
                                            const isInProgress = rec.records && rec.records.length > 0 && !rec.records[rec.records.length - 1].punchOut;
                                            
                                            let statusColor = 'bg-rose-50/30 border-rose-100 hover:border-rose-200';
                                            let statusLabel = 'Absent';
                                            let labelColor = 'bg-rose-500';
                                            let dateLabelColor = 'text-rose-700 border-rose-50';

                                            if (isInProgress) {
                                                statusColor = 'bg-amber-50/30 border-amber-100 hover:border-amber-200';
                                                statusLabel = 'In Progress';
                                                labelColor = 'bg-amber-500';
                                                dateLabelColor = 'text-amber-700 border-amber-50';
                                            } else if (isPresent) {
                                                statusColor = 'bg-emerald-50/30 border-emerald-100 hover:border-emerald-200 hover:shadow-sm';
                                                statusLabel = 'Present';
                                                labelColor = 'bg-emerald-500';
                                                dateLabelColor = 'text-emerald-700 border-emerald-50';
                                            }

                                            return (
                                                <div 
                                                    key={rec._id} 
                                                    className={`p-4 rounded-xl border transition-all group ${statusColor} ${!isPresent && !isInProgress ? 'opacity-80' : ''}`}
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className={`px-2 py-1 rounded text-xs font-bold border bg-white ${dateLabelColor}`}>
                                                            {rec.date.split('-').reverse().join('/')}
                                                        </div>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-white ${labelColor}`}>
                                                            {statusLabel}
                                                        </span>
                                                    </div>
                                                    
                                                    {isPresent || isInProgress ? (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="text-slate-500 flex items-center"><Clock className="w-3 h-3 mr-1" /> In</span>
                                                                <span className="font-semibold text-slate-700">{formatTime(rec.records?.[0]?.punchIn)}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="text-slate-500 flex items-center"><Clock className="w-3 h-3 mr-1" /> Out</span>
                                                                <span className="font-semibold text-slate-700">
                                                                    {rec.records?.[rec.records.length - 1]?.punchOut 
                                                                        ? formatTime(rec.records[rec.records.length - 1].punchOut) 
                                                                        : <span className="text-amber-600 text-[10px] font-bold animate-pulse">Punched In</span>}
                                                                </span>
                                                            </div>
                                                            <div className={`pt-2 border-t flex items-center justify-between ${isInProgress ? 'border-amber-100' : 'border-emerald-100'}`}>
                                                                <span className="text-xs text-slate-400 font-medium">Total Work</span>
                                                                <span className={`text-sm font-bold ${isInProgress ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                                    {isInProgress ? 'Calculating...' : formatDuration(rec.durationMs)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-4 space-y-1">
                                                            <AlertCircle className="w-6 h-6 text-rose-300" />
                                                            <span className="text-xs text-rose-400 font-medium italic">No Entry Found</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
                            <UserIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No Employee Selected</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-2">Please select an employee from the dropdown above to view their monthly attendance records.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
