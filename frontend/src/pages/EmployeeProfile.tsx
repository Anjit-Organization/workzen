import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, User, Calendar, Briefcase, FileText, CheckCircle2, Clock } from 'lucide-react';

export const EmployeeProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [insights, setInsights] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const response = await api.get(`/employees/${id}/insights`);
                setInsights(response.data);
            } catch (error) {
                console.error('Failed to fetch employee insights', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchInsights();
    }, [id]);

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading drilldown...</div>;
    }

    if (!insights || !insights.employee) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Employee Not Found</h2>
                <button onClick={() => navigate('/employees')} className="text-indigo-600 hover:text-indigo-800 font-medium">
                    &larr; Back to Directory
                </button>
            </div>
        );
    }

    const { employee, leaves, attendance, projects, tasks } = insights;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <button onClick={() => navigate('/employees')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
                        {employee.name}
                        <span className="ml-3 text-sm font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-100 uppercase tracking-wider">
                            {employee.employeeId || 'ID_PENDING'}
                        </span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">{employee.designation} &bull; {employee.department}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Contact & Status Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
                    <div className="h-24 w-24 bg-indigo-100 text-indigo-700 text-3xl font-bold rounded-full flex items-center justify-center mb-4">
                        {employee.name.charAt(0)}
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-1">{employee.name}</h2>
                    <p className="text-slate-500 text-sm mb-4">{employee.email}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${employee.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                        {employee.status}
                    </span>
                    <div className="w-full mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-left">
                        <div>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Phone</p>
                            <p className="text-sm text-slate-900 font-medium">{employee.phone || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Joined</p>
                            <p className="text-sm text-slate-900 font-medium">{new Date(employee.joiningDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* KPI Metrics */}
                <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-center">
                        <div className="flex items-center text-indigo-600 mb-2">
                            <Briefcase className="w-5 h-5 mr-2" />
                            <h3 className="text-sm font-semibold text-slate-700">Projects</h3>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{projects?.length || 0}</p>
                        <p className="text-xs text-slate-500 mt-1">Active assignments</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-center">
                        <div className="flex items-center text-amber-600 mb-2">
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            <h3 className="text-sm font-semibold text-slate-700">Tasks</h3>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{tasks?.filter((t: any) => t.status !== 'DONE').length || 0}</p>
                        <p className="text-xs text-slate-500 mt-1">Pending items</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-center">
                        <div className="flex items-center text-emerald-600 mb-2">
                            <Clock className="w-5 h-5 mr-2" />
                            <h3 className="text-sm font-semibold text-slate-700">Attendance</h3>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{attendance?.length || 0}</p>
                        <p className="text-xs text-slate-500 mt-1">Days logged (30d)</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-center">
                        <div className="flex items-center text-rose-600 mb-2">
                            <Calendar className="w-5 h-5 mr-2" />
                            <h3 className="text-sm font-semibold text-slate-700">Leaves</h3>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{leaves?.filter((l: any) => l.status === 'APPROVED').length || 0}</p>
                        <p className="text-xs text-slate-500 mt-1">Total approved</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Tasks & Projects list */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-900 flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-indigo-500" /> Current Workload
                        </h3>
                    </div>
                    <div className="p-5 flex-1 overflow-y-auto max-h-[400px] space-y-4">
                        {tasks?.length > 0 ? tasks.map((t: any) => (
                            <div key={t._id} className="flex justify-between items-start border border-slate-100 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                <div>
                                    <h4 className="font-medium text-slate-900">{t.title}</h4>
                                    <p className="text-xs text-indigo-600 font-medium mt-1">{t.projectId?.name || 'Assigned Task'}</p>
                                </div>
                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${t.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' :
                                    t.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                                        'bg-slate-200 text-slate-700'
                                    }`}>
                                    {t.status.replace('_', ' ')}
                                </span>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-slate-500 text-sm">No tasks assigned</div>
                        )}
                    </div>
                </div>

                {/* Attendance & Leaves */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-900 flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-indigo-500" /> Recent Attendance
                        </h3>
                    </div>
                    <div className="p-0 flex-1 overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {attendance?.length > 0 ? attendance.slice(0, 10).map((a: any) => (
                                    <tr key={a._id} className="hover:bg-slate-50">
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">{a.date}</td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm">
                                            <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 text-center inline-block min-w-[60px]">
                                                Present
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {a.durationMs ? `${Math.floor(a.durationMs / 3600000)}h ${Math.floor((a.durationMs % 3600000) / 60000)}m` : '--:--'}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={3} className="text-center py-8 text-slate-500 text-sm">No attendance records found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
