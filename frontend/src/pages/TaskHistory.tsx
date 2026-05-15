import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskService, Task } from '../services/taskService';
import { projectService, Project } from '../services/projectService';
import { employeeService, Employee } from '../services/employeeService';
import { ArrowLeft, Search, CalendarClock, Edit3, Trash2, X, ChevronDown, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

export const TaskHistory: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    // FORM STATES
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedProjectForm, setSelectedProjectForm] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [deadline, setDeadline] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [status, setStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE' | 'CLOSED'>('TODO');
    const [estimatedHours, setEstimatedHours] = useState('');
    const [startDate, setStartDate] = useState('');
    const [plannedEndDate, setPlannedEndDate] = useState('');
    const [actualEndDate, setActualEndDate] = useState('');
    const [comments, setComments] = useState('');

    const canManage =
        user?.role === 'ADMIN' ||
        user?.role === 'HR' ||
        user?.role === 'MANAGER';

    // Filters
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [assigneeSearch, setAssigneeSearch] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, [selectedProject]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [tasksData, projectsData, employeesData] = await Promise.all([
                taskService.getAll(selectedProject || undefined, undefined, 'ALL'),
                projectService.getAll(),
                employeeService.getAll({ limit: 100 })
            ]);
            setTasks(tasksData);
            setProjects(projectsData);
            setAllEmployees(employeesData.data || []);
        } catch (error) {
            console.error('Failed to fetch task history', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesAssignee = task.assigneeId?.name?.toLowerCase().includes(assigneeSearch.toLowerCase()) || false;
            if (assigneeSearch && !matchesAssignee && assigneeSearch !== '') return false;
            return true;
        });
    }, [tasks, assigneeSearch]);

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                title,
                description,
                projectId: selectedProjectForm || undefined,
                assigneeId: assigneeId || undefined,
                deadline: deadline || undefined,
                priority,
                status,
                estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
                startDate: startDate || undefined,
                plannedEndDate: plannedEndDate || undefined,
                actualEndDate: actualEndDate || undefined,
                comments
            };

            if (editingTaskId) {
                await taskService.update(editingTaskId, payload);
                toast.success('Task updated successfully');
            }
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update task');
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await taskService.delete(id);
            toast.success('Task deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete task');
        }
    };

    const updateStatus = async (id: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CLOSED') => {
        try {
            await taskService.update(id, { status: newStatus });
            toast.success('Status updated');
            fetchData();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const openEditModal = (task: any) => {
        setEditingTaskId(task._id);
        setTitle(task.title || '');
        setDescription(task.description || '');
        setSelectedProjectForm(task.projectId?._id || task.projectId || '');
        setAssigneeId(task.assigneeId?._id || task.assigneeId || '');
        setDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '');
        setPriority(task.priority || 'MEDIUM');
        setStatus(task.status || 'TODO');
        setEstimatedHours(task.estimatedHours ? String(task.estimatedHours) : '');
        setStartDate(task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '');
        setPlannedEndDate(task.plannedEndDate ? new Date(task.plannedEndDate).toISOString().split('T')[0] : '');
        setActualEndDate(task.actualEndDate ? new Date(task.actualEndDate).toISOString().split('T')[0] : '');
        setComments(task.comments || '');
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingTaskId(null);
        setTitle('');
        setDescription('');
        setSelectedProjectForm('');
        setAssigneeId('');
        setDeadline('');
        setPriority('MEDIUM');
        setStatus('TODO');
        setEstimatedHours('');
        setStartDate('');
        setPlannedEndDate('');
        setActualEndDate('');
        setComments('');
    };

    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'TODO': return 'bg-slate-50 text-slate-700 border-slate-200';
            case 'IN_PROGRESS': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'DONE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'CLOSED': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate('/tasks')}
                        className="mr-3 p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Task History</h1>
                        <p className="mt-1 text-sm text-slate-500">View and filter historical tasks.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Project</label>
                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        >
                            <option value="">All Projects</option>
                            {projects.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Search Assignee</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="E.g. John Doe..."
                                value={assigneeSearch}
                                onChange={(e) => setAssigneeSearch(e.target.value)}
                                className="w-full pl-9 rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {filteredTasks.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            No tasks found matching your filters.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Task Info</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Project</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Assignee</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Priority</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Status</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Deadline</th>
                                        <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {filteredTasks.map(task => (
                                        <tr key={task._id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{task.title}</div>
                                                <div className="text-xs text-slate-500 line-clamp-1 mt-1 max-w-xs">{task.description}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                                                    {task.projectId?.name || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                                                        {task.assigneeId?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="text-sm text-slate-700 ml-2">
                                                        {task.assigneeId?.name || 'Unassigned'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                    (task.priority || 'MEDIUM') === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                    (task.priority || 'MEDIUM') === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                        (task.priority || 'MEDIUM') === 'HIGH' ? 'bg-rose-500' :
                                                        (task.priority || 'MEDIUM') === 'MEDIUM' ? 'bg-amber-500' :
                                                        'bg-emerald-500'
                                                    }`} />
                                                    {task.priority || 'MEDIUM'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="relative inline-block w-32 group">
                                                    <select
                                                        value={task.status}
                                                        onChange={(e) => updateStatus(task._id, e.target.value as any)}
                                                        className={`appearance-none w-full text-[11px] font-bold rounded-full pl-3 pr-8 py-1.5 border focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 cursor-pointer transition-all shadow-sm group-hover:shadow-md ${getStatusClasses(task.status)}`}
                                                    >
                                                        <option value="TODO">To Do</option>
                                                        <option value="IN_PROGRESS">In Progress</option>
                                                        <option value="DONE">Done</option>
                                                        <option value="CLOSED">Closed</option>
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-current opacity-60">
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {task.deadline ? (
                                                    <div className="flex items-center text-slate-600">
                                                        <CalendarClock className="w-3.5 h-3.5 mr-1" />
                                                        {new Date(task.deadline).toLocaleDateString()}
                                                    </div>
                                                ) : <span className="text-slate-400">No deadline</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                {canManage && (
                                                    <div className="flex justify-end space-x-1">
                                                        <button
                                                            onClick={() => openEditModal(task)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-95 group"
                                                            title="Edit Task"
                                                        >
                                                            <Edit3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTask(task._id)}
                                                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-95 group"
                                                            title="Delete Task"
                                                        >
                                                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                title="Edit Task"
            >
                <form onSubmit={handleSaveTask} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                            <select
                                value={selectedProjectForm}
                                onChange={(e) => setSelectedProjectForm(e.target.value)}
                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            >
                                <option value="">General / No Project</option>
                                {projects.map(p => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Assignee</label>
                            <select
                                value={assigneeId}
                                onChange={(e) => setAssigneeId(e.target.value)}
                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            >
                                <option value="">Unassigned</option>
                                {allEmployees.map(emp => (
                                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="DONE">Done</option>
                                <option value="CLOSED">Closed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Hours</label>
                            <input
                                type="number"
                                value={estimatedHours}
                                onChange={(e) => setEstimatedHours(e.target.value)}
                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => { setIsModalOpen(false); resetForm(); }}
                            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
