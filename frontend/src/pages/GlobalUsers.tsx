import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Search, Building, MoreVertical, Edit2, Trash2, Mail, Shield, ShieldAlert, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../components/ui/Modal';

export const GlobalUsers: React.FC = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        role: ''
    });

    const isSuperAdmin = user?.role === 'SUPERADMIN';

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch global users:', error);
            toast.error('Failed to load global user directory');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isSuperAdmin) fetchUsers();
    }, [isSuperAdmin]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const confirmDelete = async (id: string) => {
        if (window.confirm('WARNING: Are you sure you want to completely erase this user? This cannot be undone.')) {
            try {
                await api.delete(`/users/${id}`);
                toast.success('User permanently deleted');
                fetchUsers();
            } catch (error) {
                toast.error('Failed to delete user');
            }
        }
    };

    const handleResetPassword = async (id: string, email: string) => {
        if (window.confirm(`Are you sure you want to force reset the password for ${email} to 'Welcome@123'?`)) {
            try {
                await api.patch(`/users/${id}/reset-password`);
                toast.success('Password successfully reset');
            } catch (error) {
                toast.error('Failed to reset password');
            }
        }
    };

    const openEdit = (u: any) => {
        setEditingUser(u);
        setFormData({
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role
        });
        setIsEditModalOpen(true);
    };

    const saveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.patch(`/users/${editingUser._id}`, formData);
            toast.success('User profile updated');
            setIsEditModalOpen(false);
            fetchUsers();
        } catch (error) {
            toast.error('Failed to update user profile');
        }
    };

    const filteredUsers = users.filter((u: any) => {
        const query = search.toLowerCase();
        return (
            u.email.toLowerCase().includes(query) ||
            u.firstName?.toLowerCase().includes(query) ||
            u.lastName?.toLowerCase().includes(query) ||
            u.role.toLowerCase().includes(query) ||
            (u.organizationId?.name || 'No Organization').toLowerCase().includes(query)
        );
    });

    if (!isSuperAdmin) {
        return <div className="p-8 text-center text-red-500 font-medium">Access Denied: SuperAdmin privileges required.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center">
                        <ShieldAlert className="w-8 h-8 text-indigo-600 mr-3" />
                        Global Directory
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Universal visibility across all connected active tenants and floating accounts.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="relative max-w-md w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Query any parameter globally (email, name, role)..."
                            value={search}
                            onChange={handleSearch}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Identity</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant Bind</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Access Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500 animate-pulse">
                                        Decrypting global payload...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
                                        No structural identities found matching current trajectory.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u: any) => (
                                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold shadow-sm">
                                                        {u.firstName?.charAt(0) || '?'}{u.lastName?.charAt(0) || '?'}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-slate-900">{u.firstName} {u.lastName}</div>
                                                    <div className="text-sm text-slate-500 flex items-center mt-0.5">
                                                        <Mail className="h-3.5 w-3.5 mr-1 text-slate-400" />
                                                        {u.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {u.organizationId ? (
                                                <span className="inline-flex items-center text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                                                    <Building className="w-3 h-3 mr-1.5 opacity-50" />
                                                    {u.organizationId.name}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                                                    Global Float
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded border ${u.role === 'SUPERADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    u.role === 'MANAGER' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                                        u.role === 'HR' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                            'bg-slate-50 text-slate-700 border-slate-200'
                                                }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end items-center space-x-3">
                                                <button
                                                    onClick={() => handleResetPassword(u._id, u.email)}
                                                    className="text-amber-600 hover:text-amber-800 transition-colors p-1"
                                                    title="Force reset password"
                                                >
                                                    <Key className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEdit(u)}
                                                    className="text-indigo-600 hover:text-indigo-900 transition-colors p-1"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                {u.role !== 'SUPERADMIN' && (
                                                    <button
                                                        onClick={() => confirmDelete(u._id)}
                                                        className="text-rose-600 hover:text-rose-900 transition-colors p-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modify Identity Core">
                <form onSubmit={saveEdit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                            <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full border-slate-300 rounded-lg p-2 text-sm border focus:ring-indigo-500 focus:border-indigo-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                            <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full border-slate-300 rounded-lg p-2 text-sm border focus:ring-indigo-500 focus:border-indigo-500" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">System Architecture Role</label>
                        <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full border-slate-300 rounded-lg p-2 text-sm border focus:ring-indigo-500 focus:border-indigo-500 bg-white" required>
                            <option value="EMPLOYEE">EMPLOYEE</option>
                            <option value="HR">HR</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPERADMIN">SUPERADMIN</option>
                        </select>
                    </div>
                    <div className="pt-4 border-t flex justify-end space-x-2">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Save Identity</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
