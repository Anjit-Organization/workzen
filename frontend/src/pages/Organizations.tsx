import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Plus, Search, Power, Settings } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Organization {
    _id: string;
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
    adminId?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    createdAt: string;
}

export const Organizations: React.FC = () => {
    const navigate = useNavigate();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [adminFirstName, setAdminFirstName] = useState('');
    const [adminLastName, setAdminLastName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/organizations');
            setOrganizations(response.data);
        } catch (error) {
            console.error('Failed to fetch organizations', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateOrganization = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/organizations', {
                name,
                adminFirstName,
                adminLastName,
                adminEmail,
            });
            toast.success('Organization created successfully');
            setIsCreateModalOpen(false);
            // Reset form
            setName('');
            setAdminFirstName('');
            setAdminLastName('');
            setAdminEmail('');
            fetchOrganizations();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create organization');
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        try {
            await api.patch(`/organizations/${id}/toggle-status`);
            toast.success(`Organization is now ${currentStatus === 'ACTIVE' ? 'inactive' : 'active'}`);
            fetchOrganizations();
        } catch (error) {
            console.error('Failed to toggle status', error);
            toast.error('Failed to update organization status');
        }
    };

    const filteredOrganizations = organizations.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage tenant organizations and their system administrators</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Organization
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search organizations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                    />
                </div>
            </div>

            {/* Companies Grid */}
            {isLoading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : filteredOrganizations.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No organizations found</h3>
                    <p className="text-gray-500">Get started by creating a new tenant organization.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOrganizations.map((org) => (
                        <div key={org._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center">
                                        <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl mr-4">
                                            {org.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{org.name}</h3>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${org.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {org.status}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Action dropdown or just manual toggle */}
                                    <button
                                        onClick={() => toggleStatus(org._id, org.status)}
                                        className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${org.status === 'ACTIVE' ? 'text-gray-400 hover:text-red-500' : 'text-gray-400 hover:text-green-500'
                                            }`}
                                        title={org.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                    >
                                        <Power className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="border-t border-gray-100 pt-4 mt-4">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Primary Administrator</h4>
                                    {org.adminId ? (
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-medium mr-3">
                                                {org.adminId.firstName.charAt(0)}{org.adminId.lastName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{org.adminId.firstName} {org.adminId.lastName}</p>
                                                <p className="text-xs text-gray-500 truncate">{org.adminId.email}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No admin assigned</p>
                                    )}
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                                <span>Created {new Date(org.createdAt).toLocaleDateString()}</span>
                                <button
                                    onClick={() => navigate(`/organizations/${org._id}`)}
                                    className="flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                                >
                                    <Settings className="h-3 w-3 mr-1" /> Manage
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Organization Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Create New Organization</h3>
                        </div>
                        <form onSubmit={handleCreateOrganization} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g. Acme Corp"
                                    />
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Admin Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={adminFirstName}
                                                onChange={(e) => setAdminFirstName(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={adminLastName}
                                                onChange={(e) => setAdminLastName(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={adminEmail}
                                        onChange={(e) => setAdminEmail(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="admin@acme.com"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Default password will be set to: Welcome@123</p>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                                >
                                    Create Organization
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
