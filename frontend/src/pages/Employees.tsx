import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { employeeService, Employee } from '../services/employeeService';
import { Search, Plus, MoreVertical, Edit2, Trash2, Mail, Phone, Briefcase } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { EmployeeForm } from '../components/EmployeeForm';
import { useNavigate } from 'react-router-dom';

export const Employees: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);

    // Setup standard state for modern React component
    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            const data = await employeeService.getAll({ search });
            setEmployees(data.data);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchEmployees();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const canManage = user?.role === 'ADMIN' || user?.role === 'HR';

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to deactivate this employee?')) {
            try {
                await employeeService.delete(id);
                fetchEmployees();
            } catch (error) {
                console.error('Failed to delete employee:', error);
            }
        }
    };

    const handleEdit = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setSelectedEmployee(undefined);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedEmployee(undefined);
    };

    const handleFormSuccess = () => {
        setIsModalOpen(false);
        fetchEmployees();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Employee Directory</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage your team members and their account permissions.
                    </p>
                </div>

                {canManage && (
                    <button
                        onClick={openAddModal}
                        className="mt-4 sm:mt-0 flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
                    >
                        <Plus className="h-5 w-5 mr-1.5" />
                        Add Employee
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50">
                    <div className="relative max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, email or department..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Employee
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Status
                                </th>
                                {canManage && (
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                                        Loading directory...
                                    </td>
                                </tr>
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                                        No employees found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                employees.map((employee) => (
                                    <tr key={employee._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => navigate(`/employees/${employee._id}`)}>
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 hover:bg-indigo-200 transition-colors flex items-center justify-center text-indigo-700 font-bold shadow-sm">
                                                        {employee.name.charAt(0)}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="text-sm font-semibold text-indigo-900 group-hover:text-indigo-600 transition-colors">{employee.name}</div>
                                                        <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{employee.employeeId}</span>
                                                    </div>
                                                    <div className="text-sm text-slate-500 flex items-center mt-1">
                                                        <Briefcase className="h-3.5 w-3.5 mr-1 text-slate-400" />
                                                        {employee.department}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900 flex items-center">
                                                <Mail className="h-4 w-4 mr-1.5 text-slate-400" />
                                                {employee.email}
                                            </div>
                                            <div className="text-sm text-slate-500 flex items-center mt-1">
                                                <Phone className="h-4 w-4 mr-1.5 text-slate-400" />
                                                {employee.phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{employee.designation}</div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                Joined {new Date(employee.joiningDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                                                }`}>
                                                {employee.status}
                                            </span>
                                        </td>
                                        {canManage && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                <button
                                                    onClick={() => handleEdit(employee)}
                                                    className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                                >
                                                    <Edit2 className="h-4 w-4 inline" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(employee._id)}
                                                    className="text-red-600 hover:text-red-900 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4 inline" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title={selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
            >
                <EmployeeForm
                    onSuccess={handleFormSuccess}
                    onCancel={handleModalClose}
                    initialData={selectedEmployee}
                />
            </Modal>
        </div>
    );
};
