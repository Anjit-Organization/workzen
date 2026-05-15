import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService, DashboardStats } from '../services/dashboardService';
import { Users, TrendingUp, Clock, AlertCircle, Building, Calendar, DollarSign, IndianRupee, Edit3, BellRing, ChevronDown } from 'lucide-react';

import { attendanceService, AttendanceStatus } from '../services/attendanceService';
import { CorrectionModal } from '../components/CorrectionModal';
import { EmployeeDashboardCalendar } from '../components/EmployeeDashboardCalendar';
import { SendNotificationModal } from '../components/SendNotificationModal';
import { employeeService } from '../services/employeeService';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
];

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [sendNotificationModalOpen, setSendNotificationModalOpen] = useState(false);

    // Attendance graph tab state
    const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); 
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [monthlyGraphData, setMonthlyGraphData] = useState<any[]>([]);
    const [monthlyLoading, setMonthlyLoading] = useState(false);

    // Attendance State
    const [attendance, setAttendance] = useState<AttendanceStatus | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [isPunching, setIsPunching] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
    const [selectedAttendanceForCorrection, setSelectedAttendanceForCorrection] = useState<{ id: string, date: string } | null>(null);

    useEffect(() => {
        // Clock tick
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchAttendance = async () => {
        try {
            const data = await attendanceService.getStatus();
            setAttendance(data);
        } catch (error) {
            console.error('Failed to fetch attendance status', error);
        }
    };

    const fetchMonthlyData = async (month: number, year: number) => {
        setMonthlyLoading(true);
        try {
            const res = await dashboardService.getMonthlyAttendance(month, year);
            setMonthlyGraphData(res.graphData);
        } catch (e) {
            console.error('Failed to fetch monthly attendance', e);
        } finally {
            setMonthlyLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'monthly') {
            fetchMonthlyData(selectedMonth, selectedYear);
        }
    }, [activeTab, selectedMonth, selectedYear]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                if (user?.role === 'SUPERADMIN') {
                    window.location.href = '/organizations';
                    return;
                }
                if (user?.role === 'EMPLOYEE' || user?.role === 'MANAGER' || user?.role === 'HR') {
                    const [attData, histData] = await Promise.all([
                        attendanceService.getStatus(),
                        attendanceService.getHistory()
                    ]);
                    setAttendance(attData);
                    setHistory(histData);
                    if (user?.role === 'EMPLOYEE') {
                        setIsLoading(false);
                        return;
                    }
                }
                const data = await dashboardService.getStats();
                setStats(data);

            } catch (err: any) {
                console.error("Failed to fetch dashboard stats", err);
                setError('Failed to load dashboard statistics.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    const handlePunch = async () => {
        if (!attendance) return;
        setIsPunching(true);
        try {
            if (attendance.punchedIn) {
                await attendanceService.punchOut();
            } else {
                await attendanceService.punchIn();
            }
            await fetchAttendance(); // Refresh status
        } catch (error) {
            console.error('Punch failed', error);
        } finally {
            setIsPunching(false);
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const formatStopwatch = (att: AttendanceStatus | null, now: Date) => {
        if (!att) return '00:00:00';
        let totalSeconds = att.todayDuration || 0;
        if (att.punchedIn && att.punchInTime) {
            const diff = Math.floor((now.getTime() - new Date(att.punchInTime).getTime()) / 1000);
            if (diff > 0) totalSeconds += diff;
        }
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading metrics...</div>;
    }

    if (user?.role === 'EMPLOYEE') {
        return (

            <div className="space-y-6 max-w-5xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Welcome back, {user?.firstName}. Have a great day at work!
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Punch Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col items-center justify-center p-8 text-center">
                        <div className="mb-6">
                            <p className="text-slate-500 font-medium mb-1">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                            <h2 className="text-5xl font-bold text-slate-900 font-mono tracking-tight">
                                {formatStopwatch(attendance, currentTime)}
                            </h2>
                        </div>

                        <button
                            onClick={handlePunch}
                            disabled={isPunching}
                            className={`w-48 h-48 rounded-full mb-6 flex flex-col items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all outline-none focus:ring-4 focus:ring-offset-4 ${attendance?.punchedIn
                                ? 'bg-gradient-to-br from-rose-500 to-rose-600 focus:ring-rose-500 shadow-rose-500/30'
                                : 'bg-gradient-to-br from-emerald-500 to-emerald-600 focus:ring-emerald-500 shadow-emerald-500/30'
                                } ${isPunching ? 'opacity-75 cursor-not-allowed scale-95' : ''}`}
                        >
                            <span className="text-4xl mb-2 drop-shadow-sm">👆</span>
                            <span className="text-2xl font-bold tracking-wide drop-shadow-sm">
                                {attendance?.punchedIn ? 'PUNCH OUT' : 'PUNCH IN'}
                            </span>
                        </button>

                        <div className="flex space-x-8 text-sm text-slate-500 mt-2 bg-slate-50 border border-slate-100 px-6 py-3 rounded-full">
                            <div className="flex flex-col items-center">
                                <span className="font-semibold text-slate-900">{formatTime(attendance?.todayDuration || 0)}</span>
                                <span>Completed Today</span>
                            </div>
                            <div className="w-px h-8 bg-slate-200"></div>
                            <div className="flex flex-col items-center">
                                <span className="font-semibold text-slate-900">{attendance?.punchedIn && attendance?.punchInTime ? new Date(attendance.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                <span>Recent Entry</span>
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col items-center text-center justify-center">
                        <Building className="h-16 w-16 text-indigo-100 mx-auto mb-5" />
                        <h3 className="text-xl font-semibold text-slate-900">Employee Portal</h3>
                        <p className="mt-2 text-slate-500 max-w-sm mx-auto leading-relaxed">
                            Use the sidebar to view the employee directory or manage your leave applications. Don't forget to punch out before logging off!
                        </p>
                    </div>
                </div>

                <EmployeeDashboardCalendar history={history} />

                {/* Employee Attendance History */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                    <h3 className="text-xl font-semibold text-slate-900 mb-6">Recent Punches</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Punch In</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Punch Out</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Duration</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {history.slice(0, 5).map((record) => (
                                    <tr key={record._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {record.records && record.records.length > 0 && record.records[0].punchIn ? new Date(record.records[0].punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {record.records && record.records.length > 0 && record.records[record.records.length - 1].punchOut ? new Date(record.records[record.records.length - 1].punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {record.durationMs ? formatTime(record.durationMs / 1000) : '--'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => {
                                                    setSelectedAttendanceForCorrection({ id: record._id, date: record.date });
                                                    setCorrectionModalOpen(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg transition-colors"
                                                title="Request Correction"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                                            No punching history found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <CorrectionModal
                    isOpen={correctionModalOpen}
                    onClose={() => { setCorrectionModalOpen(false); setSelectedAttendanceForCorrection(null); }}
                    attendanceId={selectedAttendanceForCorrection?.id || ''}
                    date={selectedAttendanceForCorrection?.date || ''}
                    onSuccess={async () => {
                        const histData = await attendanceService.getHistory();
                        setHistory(histData);
                    }}
                />
            </div>
        );
    }

    const cards = [
        { title: 'Total Employees', value: stats?.totalEmployees || 0, icon: Users, color: 'bg-indigo-500', trend: '+2 new this month', href: '/employees' },
        { title: 'Present Today', value: stats?.presentToday || 0, icon: Building, color: 'bg-emerald-500', trend: `${stats?.totalOnLeaveToday || 0} on leave`, href: '/attendance' },
        { title: 'Pending Leaves', value: stats?.pendingLeavesCount || 0, icon: Clock, color: 'bg-amber-500', trend: 'Requires HR action', href: '/leaves' },
        { title: 'Monthly Salary Cost', value: `₹${stats?.monthlySalaryCost?.toLocaleString() || 0}`, icon: IndianRupee, color: 'bg-rose-500', trend: 'Estimated payroll', href: '/employees' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Overview</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Welcome to the Admin Portal, {user?.firstName}. Here is the current company status.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button
                        onClick={() => setSendNotificationModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                    >
                        <BellRing className="w-4 h-4 mr-2" />
                        Send Notification
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm border border-rose-100">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <div
                        key={card.title}
                        onClick={() => window.location.href = card.href}
                        className="cursor-pointer bg-white rounded-xl border border-slate-200 shadow-sm p-6 transition-all hover:shadow-md hover:border-indigo-100 group"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                                <h3 className="text-3xl font-bold text-slate-900 mt-2">{card.value}</h3>
                            </div>
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${card.color} text-white shadow-sm group-hover:scale-105 transition-transform`}>
                                <card.icon className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-slate-500">
                            <TrendingUp className="h-4 w-4 mr-1 text-slate-400" />
                            <span>{card.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Attendance Visualization */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col">
                    {/* Header row: title + tabs + dropdown */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center shrink-0">
                            <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
                            Attendance Overview
                        </h3>

                        <div className="flex items-center gap-3">
                            {/* Weekly / Monthly Tabs */}
                            <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
                                <button
                                    onClick={() => setActiveTab('weekly')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                        activeTab === 'weekly'
                                            ? 'bg-white text-indigo-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    Weekly
                                </button>
                                <button
                                    onClick={() => setActiveTab('monthly')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                        activeTab === 'monthly'
                                            ? 'bg-white text-indigo-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    Monthly
                                </button>
                            </div>

                            {/* Month Dropdown — enabled only in Monthly tab */}
                            <div className={`relative ${activeTab === 'weekly' ? 'opacity-40 pointer-events-none' : ''}`}>
                                <select
                                    disabled={activeTab === 'weekly'}
                                    value={`${selectedYear}-${selectedMonth}`}
                                    onChange={(e) => {
                                        const [y, m] = e.target.value.split('-').map(Number);
                                        setSelectedYear(y);
                                        setSelectedMonth(m);
                                    }}
                                    className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-sm"
                                >
                                    {/* Current year + previous year months */}
                                    {[selectedYear, selectedYear - 1].flatMap((yr) =>
                                        MONTHS.map((mn, idx) => (
                                            <option key={`${yr}-${idx + 1}`} value={`${yr}-${idx + 1}`}>
                                                {mn} {yr}
                                            </option>
                                        ))
                                    )}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        <div className="h-48 w-full">
                            {activeTab === 'weekly' ? (
                                // ── Weekly Chart (unchanged) ──
                                stats?.attendanceGraphData ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.attendanceGraphData.slice().reverse().filter((d: any) => d.name !== 'Sat' && d.name !== 'Sun')} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                            <Tooltip
                                                cursor={{ fill: '#F1F5F9' }}
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                                                labelStyle={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}
                                            />
                                            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                            <Bar dataKey="present" name="Present" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={32} />
                                            <Bar dataKey="absent" name="Absent" fill="#CBD5E1" radius={[4, 4, 0, 0]} barSize={32} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                                        No attendance data available
                                    </div>
                                )
                            ) : (
                                // ── Monthly Chart ──
                                monthlyLoading ? (
                                    <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                                        Loading monthly data...
                                    </div>
                                ) : monthlyGraphData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyGraphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fill: '#64748B' }}
                                                dy={10}
                                                interval={0}
                                            />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                            <Tooltip
                                                cursor={{ fill: '#F1F5F9' }}
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                                                labelStyle={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}
                                            />
                                            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                            <Bar dataKey="present" name="Present" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={14} />
                                            <Bar dataKey="absent" name="Absent" fill="#CBD5E1" radius={[4, 4, 0, 0]} barSize={14} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                                        No data for {MONTHS[selectedMonth - 1]} {selectedYear}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Leaves Widget */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-4">Recent Time-Off</h3>

                    <div className="flex-1 space-y-5 overflow-y-auto pr-2">
                        {stats?.recentLeaves && stats.recentLeaves.length > 0 ? (
                            stats.recentLeaves.map((leave) => (
                                <div key={leave._id} className="flex items-start">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                                        {leave.employeeId?.firstName?.charAt(0) || 'U'}
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-slate-900">
                                                {leave.employeeId?.firstName} {leave.employeeId?.lastName}
                                            </p>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : leave.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {leave.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">{leave.type.replace('_', ' ')}</p>
                                        <p className="text-xs text-slate-400 mt-1 flex items-center">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500 text-sm flex flex-col items-center">
                                <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                                 No recent leave activity.
                            </div>

                        )}
                    </div>
                </div>
            </div>


                {/* Idle Personnel & Manager Punch Flow */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {(user?.role === 'MANAGER' || user?.role === 'HR') && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col items-center justify-center p-8 text-center">
                            <div className="mb-6">
                                <p className="text-slate-500 font-medium mb-1">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                                <h2 className="text-4xl font-bold text-slate-900 font-mono tracking-tight">
                                    {formatStopwatch(attendance, currentTime)}
                                </h2>
                            </div>

                            <button
                                onClick={handlePunch}
                                disabled={isPunching}
                                className={`w-40 h-40 rounded-full mb-6 flex flex-col items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all outline-none focus:ring-4 focus:ring-offset-4 ${attendance?.punchedIn
                                    ? 'bg-gradient-to-br from-rose-500 to-rose-600 focus:ring-rose-500 shadow-rose-500/30'
                                    : 'bg-gradient-to-br from-emerald-500 to-emerald-600 focus:ring-emerald-500 shadow-emerald-500/30'
                                    } ${isPunching ? 'opacity-75 cursor-not-allowed scale-95' : ''}`}
                            >
                                <span className="text-3xl mb-1 drop-shadow-sm">👆</span>
                                <span className="text-xl font-bold tracking-wide drop-shadow-sm">
                                    {attendance?.punchedIn ? 'PUNCH OUT' : 'PUNCH IN'}
                                </span>
                            </button>

                            <div className="flex space-x-6 text-xs text-slate-500 mt-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-full">
                                <div className="flex flex-col items-center">
                                    <span className="font-semibold text-slate-900">{formatTime(attendance?.todayDuration || 0)}</span>
                                    <span>Today</span>
                                </div>
                                <div className="w-px h-6 bg-slate-200"></div>
                                <div className="flex flex-col items-center">
                                    <span className="font-semibold text-slate-900">{attendance?.punchedIn && attendance?.punchInTime ? new Date(attendance.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                    <span>Entry</span>
                                </div>
                            </div>
                        </div>
                    )}


                    <div className={`${(user?.role === 'MANAGER' || user?.role === 'HR') ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col`}>
                        <h3 className="text-lg font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center justify-between">
                            <span className="flex items-center">
                                <Users className="w-5 h-5 mr-2 text-indigo-500" />
                                Idle Personnel
                            </span>
                            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{stats?.idleUsers?.length || 0} No Tasks</span>
                        </h3>

                        <div className="flex-1 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Department</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Designation</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {stats?.idleUsers?.length ? (
                                        stats.idleUsers.map((u) => (
                                            <tr key={u._id}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{u.name}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 text-xs font-bold">
                                                    <span className={`px-2 py-0.5 rounded-full ${u.role === 'HR' ? 'bg-purple-100 text-purple-700' : u.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{u.department}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{u.designation}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                                                    <button 
                                                        onClick={() => window.location.href = '/tasks'}
                                                        className="text-indigo-600 hover:text-indigo-900 font-medium text-xs"
                                                    >
                                                        Assign Task
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                                                All personnel have active tasks.
                                            </td>
                                        </tr>
                                    )}

                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>





                {/* Pending Salaries Widget */}
                <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col mt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center justify-between">
                        <span>Pending Salary Disbursements</span>
                        <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{stats?.pendingSalaries?.length || 0} Pending</span>
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Employee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Due Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {stats?.pendingSalaries?.length ? (
                                    stats.pendingSalaries.map((salary) => (
                                        <tr key={salary._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{salary.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{salary.department}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-rose-600 font-medium">Date {salary.salaryDate}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">₹{salary.payroll.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await employeeService.markSalaryPaid(salary._id);
                                                            const data = await dashboardService.getStats();
                                                            setStats(data);
                                                            toast.success('Salary marked as paid');
                                                        } catch (e) { toast.error('Failed to mark paid') }
                                                    }}
                                                    className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded text-xs font-semibold transition-colors"
                                                >
                                                    Mark Paid
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                                            No pending salary payments.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {(user?.role === 'MANAGER' || user?.role === 'HR') && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 mt-6">
                        <h3 className="text-xl font-semibold text-slate-900 mb-6">Your Recent Punches</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Punch In</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Punch Out</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Duration</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {history.slice(0, 5).map((record) => (
                                        <tr key={record._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {record.records && record.records.length > 0 && record.records[0].punchIn ? new Date(record.records[0].punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {record.records && record.records.length > 0 && record.records[record.records.length - 1].punchOut ? new Date(record.records[record.records.length - 1].punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {record.durationMs ? formatTime(record.durationMs / 1000) : '--'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            <SendNotificationModal
                isOpen={sendNotificationModalOpen}
                onClose={() => setSendNotificationModalOpen(false)}
            />
        </div>
    );
};
