import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { leaveService, Leave, LeaveBalance } from '../services/leaveService';
import { Modal } from '../components/ui/Modal';
import { ApplyLeaveForm } from '../components/ApplyLeaveForm';
import { Plus, Check, X, Clock, Calendar, User as UserIcon, ChevronDown, AlertCircle } from 'lucide-react';
import { employeeService, Employee } from '../services/employeeService';

export const Leaves: React.FC = () => {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [balance, setBalance] = useState<LeaveBalance | null>(null);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'requests' | 'monthly'>('requests');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<{ id: string, name: string } | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [monthlyLeaves, setMonthlyLeaves] = useState<Leave[]>([]);
    const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);

    // For HR/Admin, they see all leaves. For Employee, they see only their leaves.
    // In a real app we would pass employeeId to getAllLeaves, but backend handles this via querying if we pass it, or we can fetch all and backend filters by role natively if implemented. 
    // For safety, we will pass employeeId if role is EMPLOYEE.
    const fetchLeavesAndBalance = async () => {
        setIsLoading(true);
        try {
            const canApplyLeave = user?.role === 'EMPLOYEE' || user?.role === 'HR' || user?.role === 'MANAGER';
            if (canApplyLeave) {
                // For employees, HR, and Managers — fetch personal leaves + balance
                const [leavesData, balanceData] = await Promise.all([
                    leaveService.getAllLeaves(),
                    leaveService.getBalance()
                ]);
                setLeaves(leavesData.data);
                setBalance(balanceData);
            } else {
                // Admin — see all org leaves, no personal balance
                const leavesData = await leaveService.getAllLeaves();
                setLeaves(leavesData.data);
            }
        } catch (error) {
            console.error('Failed to fetch leaves:', error);
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

    useEffect(() => {
        if (user?.role !== 'EMPLOYEE') {
            fetchEmployees();
        }
    }, [user]);

    useEffect(() => {
        if (activeTab === 'requests') {
            fetchLeavesAndBalance();
        }
    }, [user, activeTab]);

    useEffect(() => {
        const fetchMonthly = async () => {
            // For HR/Admin, require an employee to be selected
            if (user?.role !== 'EMPLOYEE' && !selectedEmployee) return;
            
            setIsMonthlyLoading(true);
            try {
                // For HR/Admin, pass the Employee document _id (not userId)
                // For EMPLOYEE, don't pass employeeId — backend resolves it from session
                const params = user?.role !== 'EMPLOYEE' && selectedEmployee
                    ? { employeeId: selectedEmployee.id, limit: 200 }
                    : { limit: 200 };

                const leavesData = await leaveService.getAllLeaves(params);
                
                // Filter leaves overlapping with the selected month (all statuses shown, color-coded)
                const [year, month] = selectedMonth.split('-').map(Number);
                const monthStart = new Date(year, month - 1, 1);
                const monthEnd = new Date(year, month, 0, 23, 59, 59);

                const filtered = leavesData.data.filter((l: Leave) => {
                    const lStart = new Date(l.startDate);
                    const lEnd = new Date(l.endDate);
                    return lStart <= monthEnd && lEnd >= monthStart;
                });
                
                setMonthlyLeaves(filtered);
            } catch (error) {
                console.error('Failed to fetch monthly leaves', error);
            } finally {
                setIsMonthlyLoading(false);
            }
        };
        
        if (activeTab === 'monthly') {
            fetchMonthly();
        }
    }, [selectedEmployee, selectedMonth, activeTab, user]);

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
                        {user?.role === 'ADMIN' ? 'Review and manage all employee leave requests' : 'Apply for leave and manage your applications'}
                    </p>
                </div>
                {(user?.role === 'EMPLOYEE' || user?.role === 'HR' || user?.role === 'MANAGER') && (
                    <button
                        onClick={() => setIsApplyModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Apply Leave
                    </button>
                )}
            </div>

            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'requests' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    Leave Requests
                </button>
                <button
                    onClick={() => setActiveTab('monthly')}
                    className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'monthly' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    Monthly View
                </button>
            </div>

            {activeTab === 'requests' ? (
                <>
                    {(user?.role === 'EMPLOYEE' || user?.role === 'HR' || user?.role === 'MANAGER') && balance && (
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
            </>
            ) : (
                <div className="space-y-6">
                    {user?.role !== 'EMPLOYEE' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Select Employee</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none text-slate-700 font-medium cursor-pointer transition-all hover:bg-slate-100"
                                            value={selectedEmployee?.id || ''}
                                            onChange={(e) => {
                                                // Use emp._id (Employee document ID) — this is what backend's findAll filters by
                                                const empDocId = e.target.value;
                                                const emp = employees.find(emp => emp._id === empDocId);
                                                if (emp) {
                                                    setSelectedEmployee({ id: emp._id, name: emp.name });
                                                } else {
                                                    setSelectedEmployee(null);
                                                }
                                            }}
                                        >
                                            <option value="">Choose an employee...</option>
                                            {employees.map(emp => (
                                                <option key={emp._id} value={emp._id}>
                                                    {emp.name} ({emp.department})
                                                </option>
                                            ))}
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
                    )}

                    {user?.role === 'EMPLOYEE' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center max-w-sm">
                            <label className="block text-sm font-semibold text-slate-700 mr-4">Select Month</label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 font-medium cursor-pointer transition-all hover:bg-slate-100"
                            />
                        </div>
                    )}

                    {((user?.role !== 'EMPLOYEE' && selectedEmployee) || user?.role === 'EMPLOYEE') ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center">
                                    <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
                                    Monthly Leaves: <span className="text-indigo-600 ml-2">{user?.role === 'EMPLOYEE' ? 'You' : selectedEmployee?.name}</span>
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">Approved leaves for {new Date(selectedMonth).toLocaleDateString('default', { month: 'long', year: 'numeric' })}</p>
                            </div>

                            <div className="p-6">
                                {isMonthlyLoading ? (
                                    <div className="py-20 text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                                        <p className="mt-4 text-slate-500">Fetching records...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {(() => {
                                            const [year, mon] = selectedMonth.split('-').map(Number);
                                            const daysInMonth = new Date(year, mon, 0).getDate();
                                            const days = [];
                                            for (let i = 1; i <= daysInMonth; i++) {
                                                const d = new Date(year, mon - 1, i);
                                                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                                const dateStr = `${year}-${String(mon).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                                                
                                                const leaveForDay = monthlyLeaves.find(l => {
                                                    // Compare as local date strings to avoid timezone shifts
                                                    const sDate = new Date(l.startDate);
                                                    const eDate = new Date(l.endDate);
                                                    const s = `${sDate.getFullYear()}-${String(sDate.getMonth()+1).padStart(2,'0')}-${String(sDate.getDate()).padStart(2,'0')}`;
                                                    const e = `${eDate.getFullYear()}-${String(eDate.getMonth()+1).padStart(2,'0')}-${String(eDate.getDate()).padStart(2,'0')}`;
                                                    return dateStr >= s && dateStr <= e;
                                                });

                                                let statusColor = 'bg-slate-50/50 border-slate-100 hover:border-slate-200';
                                                let typeLabel = 'Working Day';
                                                let typeLabelColor = 'bg-slate-300 text-slate-700';
                                                let dateLabelColor = 'text-slate-500 border-slate-100';

                                                if (leaveForDay) {
                                                    typeLabel = leaveForDay.type.replace('_', ' ');
                                                    if (leaveForDay.type === 'CASUAL') {
                                                        statusColor = 'bg-indigo-50 border-indigo-200';
                                                        typeLabelColor = 'bg-indigo-500 text-white';
                                                        dateLabelColor = 'text-indigo-700 border-indigo-100';
                                                    } else if (leaveForDay.type === 'SICK') {
                                                        statusColor = 'bg-rose-50 border-rose-200';
                                                        typeLabelColor = 'bg-rose-500 text-white';
                                                        dateLabelColor = 'text-rose-700 border-rose-100';
                                                    } else if (leaveForDay.type === 'PRIVILEGE') {
                                                        statusColor = 'bg-amber-50 border-amber-200';
                                                        typeLabelColor = 'bg-amber-500 text-white';
                                                        dateLabelColor = 'text-amber-700 border-amber-100';
                                                    }
                                                } else if (isWeekend) {
                                                    statusColor = 'bg-slate-100/50 border-slate-200';
                                                    typeLabel = 'Weekend';
                                                    typeLabelColor = 'bg-slate-400 text-white';
                                                    dateLabelColor = 'text-slate-600 border-slate-200';
                                                }

                                                const approvalBadge = leaveForDay
                                                    ? leaveForDay.status === 'APPROVED'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : leaveForDay.status === 'REJECTED'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                    : null;

                                                days.push(
                                                    <div key={i} className={`p-4 rounded-xl border transition-all ${statusColor} ${!leaveForDay && !isWeekend ? 'opacity-70' : 'shadow-sm'}`}>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className={`px-2 py-1 rounded text-[10px] font-black border bg-white flex flex-col items-center leading-tight ${dateLabelColor}`}>
                                                                <span className="text-sm">{String(i).padStart(2, '0')}/{String(mon).padStart(2, '0')}</span>
                                                                <span className="uppercase opacity-60">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                                            </div>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${typeLabelColor}`}>
                                                                {typeLabel}
                                                            </span>
                                                        </div>
                                                        {leaveForDay ? (
                                                            <div className="mt-2 space-y-1">
                                                                <div className="text-xs text-slate-600 font-medium truncate">{leaveForDay.reason}</div>
                                                                {approvalBadge && (
                                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${approvalBadge}`}>
                                                                        {leaveForDay.status}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-slate-400 italic text-center mt-4">
                                                                {isWeekend ? 'Off' : 'No Leave'}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            return days;
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
                            <UserIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No Employee Selected</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-2">Please select an employee from the dropdown above to view their monthly leave calendar.</p>
                        </div>
                    )}
                </div>
            )}

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
