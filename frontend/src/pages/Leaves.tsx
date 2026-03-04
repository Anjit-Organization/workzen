import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { leaveService, Leave, LeaveBalance } from '../services/leaveService';
import { Modal } from '../components/ui/Modal';
import { ApplyLeaveForm } from '../components/ApplyLeaveForm';
import { Plus, Check, X, Clock, Calendar } from 'lucide-react';

export const Leaves: React.FC = () => {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [balance, setBalance] = useState<LeaveBalance | null>(null);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // For HR/Admin, they see all leaves. For Employee, they see only their leaves.
    // In a real app we would pass employeeId to getAllLeaves, but backend handles this via querying if we pass it, or we can fetch all and backend filters by role natively if implemented. 
    // For safety, we will pass employeeId if role is EMPLOYEE.
    const fetchLeavesAndBalance = async () => {
        setIsLoading(true);
        try {
            if (user?.role === 'EMPLOYEE') {
                const [leavesData, balanceData] = await Promise.all([
                    leaveService.getAllLeaves(),
                    leaveService.getBalance()
                ]);
                setLeaves(leavesData.data);
                setBalance(balanceData);
            } else {
                // HR/Admin view
                const leavesData = await leaveService.getAllLeaves();
                setLeaves(leavesData.data);
            }
        } catch (error) {
            console.error('Failed to fetch leaves:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeavesAndBalance();
    }, [user]);

    const handleStatusUpdate = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            await leaveService.updateStatus(leaveId, status);
            fetchLeavesAndBalance(); // Refresh list to reflect balance/status changes
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update leave status. See console for details.');
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'APPROVED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><Check className="w-3 h-3 mr-1" /> Approved</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><X className="w-3 h-3 mr-1" /> Rejected</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {user?.role === 'EMPLOYEE' ? 'Manage your leave applications and balance' : 'Review employee leave requests'}
                    </p>
                </div>
                {user?.role === 'EMPLOYEE' && (
                    <button
                        onClick={() => setIsApplyModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Apply Leave
                    </button>
                )}
            </div>

            {user?.role === 'EMPLOYEE' && balance && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center">
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Casual Leave</span>
                        <span className="text-4xl font-bold text-indigo-600">{balance.casualLeave}</span>
                        <span className="text-sm text-gray-400 mt-1">Days Remaining</span>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center">
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Sick Leave</span>
                        <span className="text-4xl font-bold text-emerald-600">{balance.sickLeave}</span>
                        <span className="text-sm text-gray-400 mt-1">Days Remaining</span>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center">
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Privilege Leave</span>
                        <span className="text-4xl font-bold text-amber-600">{balance.privilegeLeave}</span>
                        <span className="text-sm text-gray-400 mt-1">Days Remaining</span>
                    </div>
                </div>
            )}

            {/* Leaves Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {user?.role !== 'EMPLOYEE' && (
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Employee
                                    </th>
                                )}
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Leave Type
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Duration
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Reason
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                {user?.role !== 'EMPLOYEE' && (
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={user?.role !== 'EMPLOYEE' ? 6 : 4} className="px-6 py-12 text-center text-gray-500">
                                        Loading leaves...
                                    </td>
                                </tr>
                            ) : leaves.length === 0 ? (
                                <tr>
                                    <td colSpan={user?.role !== 'EMPLOYEE' ? 6 : 4} className="px-6 py-12 text-center text-gray-500">
                                        <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                        <p>No leave records found</p>
                                    </td>
                                </tr>
                            ) : (
                                leaves.map((leave) => (
                                    <tr key={leave._id} className="hover:bg-gray-50">
                                        {user?.role !== 'EMPLOYEE' && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                                                        {typeof leave.employeeId !== 'string' && leave.employeeId?.firstName?.charAt(0) || '?'}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {typeof leave.employeeId !== 'string' && leave.employeeId ? `${leave.employeeId.firstName} ${leave.employeeId.lastName}` : 'Unknown'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {typeof leave.employeeId !== 'string' && leave.employeeId?.department}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{leave.type.replace('_', ' ')}</div>
                                            <div className="text-xs text-gray-500">Applied: {new Date(leave.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>{new Date(leave.startDate).toLocaleDateString()} to</div>
                                            <div>{new Date(leave.endDate).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={leave.reason}>
                                            {leave.reason}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={leave.status} />
                                        </td>
                                        {user?.role !== 'EMPLOYEE' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {leave.status === 'PENDING' ? (
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleStatusUpdate(leave._id, 'APPROVED')}
                                                            className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 px-3 py-1 rounded-md transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(leave._id, 'REJECTED')}
                                                            className="text-rose-600 hover:text-rose-900 bg-rose-50 px-3 py-1 rounded-md transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">
                                                        Processed by {leave.approvedBy ? `${leave.approvedBy.firstName} ${leave.approvedBy.lastName}` : 'System'}
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Apply Leave Modal */}
            <Modal
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
                title="Apply for Leave"
            >
                <ApplyLeaveForm
                    onSuccess={() => {
                        setIsApplyModalOpen(false);
                        fetchLeavesAndBalance();
                    }}
                    onCancel={() => setIsApplyModalOpen(false)}
                />
            </Modal>
        </div>
    );
};
