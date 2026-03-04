import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building, ArrowLeft, Users, Activity, UserMinus, ShieldAlert, Key } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface OrgStats {
    organization: {
        _id: string;
        name: string;
        status: string;
        createdAt: string;
        adminId: {
            firstName: string;
            lastName: string;
            email: string;
            role: string;
        }
    };
    stats: {
        totalEmployees: number;
        activeEmployees: number;
        inactiveEmployees: number;
        totalUsers: number;
    };
    users: Array<{
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        isActive: boolean;
        createdAt: string;
    }>;
}

export const OrganizationDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<OrgStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isResetting, setIsResetting] = useState<string | null>(null);

    useEffect(() => {
        fetchOrgDetails();
    }, [id]);

    const fetchOrgDetails = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/organizations/${id}/stats`);
            setData(response.data);
        } catch (error) {
            toast.error('Failed to load organization details');
            navigate('/organizations');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (userId: string, userName: string) => {
        if (!window.confirm(`Are you sure you want to forcibly reset the password for ${userName}?`)) {
            return;
        }

        try {
            setIsResetting(userId);
            const response = await api.patch(`/users/${userId}/reset-password`);
            toast.success(response.data.message || 'Password reset successfully');
        } catch (error) {
            toast.error('Failed to reset password');
        } finally {
            setIsResetting(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!data) return null;

    // Mock data for the chart to simulate ecosystem growth visualization
    const chartData = [
        { name: 'Jan', employees: Math.floor(data.stats.totalEmployees * 0.2) },
        { name: 'Feb', employees: Math.floor(data.stats.totalEmployees * 0.4) },
        { name: 'Mar', employees: Math.floor(data.stats.totalEmployees * 0.5) },
        { name: 'Apr', employees: Math.floor(data.stats.totalEmployees * 0.8) },
        { name: 'May', employees: data.stats.totalEmployees },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate('/organizations')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        {data.organization.name}
                        <span className={`ml-3 text-xs px-2.5 py-0.5 rounded-full font-medium ${data.organization.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {data.organization.status}
                        </span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Tenant Ecosystem Overview & Management</p>
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                        <Users className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{data.stats.totalEmployees}</div>
                    <div className="text-sm font-medium text-gray-500 mt-1">Total Employees</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
                        <Activity className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{data.stats.activeEmployees}</div>
                    <div className="text-sm font-medium text-gray-500 mt-1">Active Accounts</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                        <UserMinus className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{data.stats.inactiveEmployees}</div>
                    <div className="text-sm font-medium text-gray-500 mt-1">Inactive Accounts</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                        <ShieldAlert className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{data.stats.totalUsers}</div>
                    <div className="text-sm font-medium text-gray-500 mt-1">Administrative Seats</div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Workforce Growth Trajectory</h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorEmployees" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="employees" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorEmployees)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Deep Directory */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">Tenant Operational Users</h3>
                    <p className="text-sm text-gray-500 mt-1">SuperAdmins possess explicit authority to trigger credential resets.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.users.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'HR' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleResetPassword(user._id, `${user.firstName} ${user.lastName}`)}
                                            disabled={isResetting === user._id}
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-amber-700 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-50"
                                            title="Force Password Reset to Default"
                                        >
                                            <Key className="h-4 w-4 mr-1.5" />
                                            {isResetting === user._id ? 'Resetting...' : 'Reset Password'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
