import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { employeeService, Employee } from '../services/employeeService';

interface EmployeeFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: Employee;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSuccess, onCancel, initialData }) => {
    const { user } = useAuth();
    const canManage = user?.role === 'ADMIN' || user?.role === 'HR';
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        department: initialData?.department || '',
        designation: initialData?.designation || '',
        joiningDate: initialData?.joiningDate ? new Date(initialData.joiningDate).toISOString().split('T')[0] : '',
        status: initialData?.status || 'ACTIVE',
        payroll: initialData?.payroll || 0,
        casualLeaveQuota: initialData?.casualLeaveQuota || 12,
        salaryDate: initialData?.salaryDate || 1,
        sickLeaveQuota: initialData?.sickLeaveQuota || 12,
        privilegeLeaveQuota: initialData?.privilegeLeaveQuota || 15
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'number' ? Number(value) : value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (initialData) {
                await employeeService.update(initialData._id, formData);
            } else {
                await employeeService.create(formData);
            }
            onSuccess();
        } catch (err: any) {
            // Error is handled globally by axios interceptor toast
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                        placeholder="John Doe"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                        placeholder="exmple@company.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <input
                        type="text"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                        placeholder="+91 1234567890"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                    <select
                        name="department"
                        required
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-white"
                    >
                        <option value="">Select Department</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Product">Product</option>
                        <option value="Design">Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                        <option value="HR">Human Resources</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                    <input
                        type="text"
                        name="designation"
                        required
                        value={formData.designation}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                        placeholder="Software Engineer"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Joining Date</label>
                    <input
                        type="date"
                        name="joiningDate"
                        required
                        value={formData.joiningDate}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    />
                </div>

                {canManage && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Salary (₹)</label>
                            <input
                                type="number"
                                name="payroll"
                                required
                                min="0"
                                value={formData.payroll}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                placeholder="Enter your salary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Salary Date (Day of Month)</label>
                            <input
                                type="number"
                                name="salaryDate"
                                required
                                min="1"
                                max="31"
                                value={formData.salaryDate}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                placeholder="1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Casual Leaves (Per Year)</label>
                            <input
                                type="number"
                                name="casualLeaveQuota"
                                required
                                min="0"
                                max="365"
                                value={formData.casualLeaveQuota}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                placeholder="12"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sick Leaves (Per Year)</label>
                            <input
                                type="number"
                                name="sickLeaveQuota"
                                required
                                min="0"
                                max="365"
                                value={formData.sickLeaveQuota}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                placeholder="12"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Privilege Leaves (Per Year)</label>
                            <input
                                type="number"
                                name="privilegeLeaveQuota"
                                required
                                min="0"
                                max="365"
                                value={formData.privilegeLeaveQuota}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                placeholder="15"
                            />
                        </div>
                    </>
                )}

                {initialData && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select
                            name="status"
                            required
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-white"
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="TERMINATED">Terminated</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Saving...' : initialData ? 'Update Employee' : 'Add Employee'}
                </button>
            </div>
        </form>
    );
};
