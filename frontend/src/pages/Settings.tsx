import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Plus } from 'lucide-react';
import api from '../services/api';

interface HRUser {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

export const Settings: React.FC = () => {
    const { user } = useAuth();
    const canManageHR = user?.role === 'ADMIN';

    const [hrUsers, setHrUsers] = useState<HRUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New HR state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '' // Only needed on creation
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchHRUsers = async () => {
        if (!canManageHR) return;
        setIsLoading(true);
        try {
            const response = await api.get('/users/hr');
            setHrUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch HR users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHRUsers();
    }, [canManageHR]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreateHR = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        try {
            await api.post('/users/hr', {
                email: formData.email,
                passwordHash: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName
            });
            setSuccess('HR account created successfully.');
            setFormData({ firstName: '', lastName: '', email: '', password: '' });
            fetchHRUsers();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create HR account.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!canManageHR) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Shield className="h-12 w-12 text-slate-300 mb-4" />
                <h2 className="text-xl font-medium text-slate-700">Access Denied</h2>
                <p>Only Administrators can manage settings.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Settings</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Manage administrative privileges and system configurations.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Create HR Form */}
                <div className="lg:col-span-1 border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden h-fit">
                    <div className="p-5 border-b border-slate-200 bg-slate-50">
                        <h2 className="text-lg font-medium text-slate-800 flex items-center">
                            <Plus className="h-5 w-5 mr-2 text-indigo-500" />
                            Create HR Manager
                        </h2>
                    </div>
                    <form onSubmit={handleCreateHR} className="p-5 space-y-4">
                        {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}
                        {success && <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg">{success}</div>}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                            <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                            <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                        </div>

                        <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                            {isSubmitting ? 'Creating...' : 'Create Account'}
                        </button>
                    </form>
                </div>

                {/* List of HRs */}
                <div className="lg:col-span-2 border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-200 bg-slate-50">
                        <h2 className="text-lg font-medium text-slate-800 flex items-center">
                            <Shield className="h-5 w-5 mr-2 text-indigo-500" />
                            Active HR Administrators
                        </h2>
                    </div>
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500 text-sm">Loading HR accounts...</div>
                    ) : hrUsers.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">No HR accounts found.</div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {hrUsers.map(user => (
                                <li key={user._id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-4">
                                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{user.firstName} {user.lastName}</p>
                                            <p className="text-sm text-slate-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                                        {user.role}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

            </div>
        </div>
    );
};
