import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskService, Task } from '../services/taskService';
import { projectService, Project } from '../services/projectService';
import { employeeService, Employee } from '../services/employeeService';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Plus,
    CheckCircle2,
    Clock,
    PlayCircle,
    Calendar,
    CalendarClock,
    History,
    Search,
    X,
    ChevronDown
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

export const Tasks: React.FC = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const projectIdFilter = searchParams.get('project');

    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    // FORM STATES
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [deadline, setDeadline] = useState('');

    // NEW FIELDS
    const [priority, setPriority] = useState('MEDIUM');
    const [estimatedHours, setEstimatedHours] = useState('');
    const [startDate, setStartDate] = useState('');
    const [plannedEndDate, setPlannedEndDate] = useState('');
    const [actualEndDate, setActualEndDate] = useState('');
    const [comments, setComments] = useState('');

    const [activeTab, setActiveTab] = useState<'KANBAN' | 'SHEET'>('KANBAN');

    // SHEET SEARCH & FILTERS
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterOwner, setFilterOwner] = useState('');
    const [filterProject, setFilterProject] = useState('');

    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'TODO': return 'bg-slate-50 text-slate-700 border-slate-200';
            case 'IN_PROGRESS': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'DONE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'CLOSED': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getPriorityClasses = (priority: string) => {
        switch (priority) {
            case 'HIGH': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'LOW': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const canManage =
        user?.role === 'ADMIN' ||
        user?.role === 'HR' ||
        user?.role === 'MANAGER';

    useEffect(() => {
        fetchData();
    }, [projectIdFilter]);

    const fetchData = async () => {
        setIsLoading(true);

        try {
            const [tasksData, projectsData, employeesData] = await Promise.all([
                taskService.getAll(
                    projectIdFilter || undefined,
                    undefined,
                    'NOT_CLOSED'
                ),
                projectService.getAll(),
                employeeService.getAll({ limit: 100 })
            ]);

            setTasks(tasksData);
            setProjects(projectsData);
            setAllEmployees(employeesData.data || []);
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate: Project is mandatory for regular employees
        const selectedEmp = allEmployees.find(emp => emp._id === assigneeId);
        const role = selectedEmp?.role || (selectedEmp?.userId as any)?.role;

        if (!selectedProject && role === 'EMPLOYEE') {
            toast.error('Project is mandatory for regular employees');
            return;
        }

        try {
            const payload = {
                title,
                description,
                projectId: selectedProject || undefined,
                assigneeId: assigneeId || undefined,
                deadline: deadline || undefined,

                // NEW
                priority,
                estimatedHours: estimatedHours
                    ? Number(estimatedHours)
                    : undefined,
                startDate: startDate || undefined,
                plannedEndDate: plannedEndDate || undefined,
                actualEndDate: actualEndDate || undefined,
                comments
            };

            if (editingTaskId) {
                await taskService.update(editingTaskId, payload);
                toast.success('Task updated successfully');
            } else {
                await taskService.create(payload);
                toast.success('Task created successfully');
            }

            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                `Failed to ${editingTaskId ? 'update' : 'create'
                } task`
            );
        }
    };

    const openEditModal = (task: any) => {
        setEditingTaskId(task._id);

        setTitle(task.title || '');
        setDescription(task.description || '');

        setSelectedProject(
            task.projectId?._id || (task.projectId as string)
        );

        setAssigneeId(
            task.assigneeId?._id ||
            (task.assigneeId as string) ||
            ''
        );

        setDeadline(
            task.deadline
                ? new Date(task.deadline)
                    .toISOString()
                    .split('T')[0]
                : ''
        );

        // NEW
        setPriority(task.priority || 'MEDIUM');

        setEstimatedHours(
            task.estimatedHours
                ? String(task.estimatedHours)
                : ''
        );

        setStartDate(
            task.startDate
                ? new Date(task.startDate)
                    .toISOString()
                    .split('T')[0]
                : ''
        );

        setPlannedEndDate(
            task.plannedEndDate
                ? new Date(task.plannedEndDate)
                    .toISOString()
                    .split('T')[0]
                : ''
        );

        setActualEndDate(
            task.actualEndDate
                ? new Date(task.actualEndDate)
                    .toISOString()
                    .split('T')[0]
                : ''
        );

        setComments(task.comments || '');

        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingTaskId(null);

        setTitle('');
        setDescription('');
        setSelectedProject('');
        setAssigneeId('');
        setDeadline('');

        // NEW
        setPriority('MEDIUM');
        setEstimatedHours('');
        setStartDate('');
        setPlannedEndDate('');
        setActualEndDate('');
        setComments('');
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const updateStatus = async (
        id: string,
        status:
            | 'TODO'
            | 'IN_PROGRESS'
            | 'DONE'
            | 'CLOSED'
    ) => {
        try {
            await taskService.update(id, { status });

            toast.success('Status updated');
            fetchData();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    // KANBAN
    const todoTasks = tasks.filter(
        (t) => t.status === 'TODO'
    );

    const inProgressTasks = tasks.filter(
        (t) => t.status === 'IN_PROGRESS'
    );

    const doneTasks = tasks.filter(
        (t) => t.status === 'DONE'
    );

    // NO CHANGES IN TASK UI
    const KanbanColumn = ({
        title,
        tasks,
        icon: Icon,
        colorClass
    }: any) => (
        <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-3 min-h-[500px] flex flex-col">
            <h3
                className={`text-sm font-semibold mb-3 flex items-center ${colorClass}`}
            >
                <Icon className="w-4 h-4 mr-1.5" />
                {title} ({tasks.length})
            </h3>

            <div className="space-y-3 flex-1">
                {tasks.map((task: Task) => {
                    const today = new Date();

                    today.setHours(0, 0, 0, 0);

                    const deadline = task.deadline
                        ? new Date(task.deadline)
                        : null;

                    deadline?.setHours(0, 0, 0, 0);

                    const isOverdue =
                        deadline &&
                        deadline < today &&
                        task.status !== 'DONE';

                    const isApproaching =
                        deadline &&
                        deadline > today &&
                        deadline.getTime() -
                        today.getTime() <=
                        48 *
                        60 *
                        60 *
                        1000 &&
                        task.status !== 'DONE';

                    const cardBg = isOverdue
                        ? 'bg-red-50 border-red-300'
                        : isApproaching
                            ? 'bg-amber-50 border-amber-300'
                            : 'bg-white border-slate-200';

                    const dlColor = isOverdue
                        ? 'text-red-700 bg-red-100'
                        : isApproaching
                            ? 'text-amber-700 bg-amber-100'
                            : 'text-amber-600 bg-amber-50';

                    return (
                        <div
                            key={task._id}
                            className={`p-3 rounded-lg shadow-sm border hover:shadow-md transition-shadow ${cardBg}`}
                        >
                            <div className="flex justify-between items-start mb-1.5">
                                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                    {task.projectId?.name ||
                                        'General'}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getPriorityClasses(task.priority || 'MEDIUM')}`}>
                                    {task.priority || 'MEDIUM'}
                                </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 mb-1 leading-tight">
                                {task.title}
                            </h4>

                            <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                                {task.description}
                            </p>

                            {task.deadline && (
                                <div
                                    className={`flex items-center text-[10px] font-medium mb-2 self-start px-1.5 py-0.5 rounded w-fit ${dlColor}`}
                                >
                                    <CalendarClock className="w-3 h-3 mr-1" />
                                    Due{' '}
                                    {new Date(
                                        task.deadline
                                    ).toLocaleDateString()}
                                </div>
                            )}

                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="h-5 w-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[9px] font-bold title">
                                            {task.assigneeId?.name?.charAt(
                                                0
                                            ) || 'U'}
                                        </div>

                                        <span className="text-[10px] text-slate-500 ml-1.5 truncate max-w-[100px]">
                                            {task.assigneeId?.name ||
                                                'Unassigned'}
                                        </span>
                                    </div>

                                    {canManage && (
                                        <button
                                            onClick={() =>
                                                openEditModal(
                                                    task
                                                )
                                            }
                                            className="text-indigo-600 hover:text-indigo-800 text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex space-x-1 mt-2">
                                {task.status !==
                                    'TODO' && (
                                        <button
                                            onClick={() =>
                                                updateStatus(
                                                    task._id,
                                                    'TODO'
                                                )
                                            }
                                            className="flex-1 text-[9px] font-medium py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                        >
                                            Todo
                                        </button>
                                    )}

                                {task.status !==
                                    'IN_PROGRESS' && (
                                        <button
                                            onClick={() =>
                                                updateStatus(
                                                    task._id,
                                                    'IN_PROGRESS'
                                                )
                                            }
                                            className="flex-1 text-[9px] font-medium py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                                        >
                                            Start
                                        </button>
                                    )}

                                {task.status !==
                                    'DONE' && (
                                        <button
                                            onClick={() =>
                                                updateStatus(
                                                    task._id,
                                                    'DONE'
                                                )
                                            }
                                            className="flex-1 text-[9px] font-medium py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                        >
                                            Complete
                                        </button>
                                    )}

                                {task.status ===
                                    'DONE' &&
                                    canManage && (
                                        <button
                                            onClick={() =>
                                                updateStatus(
                                                    task._id,
                                                    'CLOSED'
                                                )
                                            }
                                            className="flex-1 text-[9px] font-medium py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                        >
                                            Close
                                        </button>
                                    )}
                            </div>
                        </div>
                    );
                })}

                {tasks.length === 0 && (
                    <div className="h-full flex items-center justify-center text-sm text-slate-400 italic">
                        No tasks
                    </div>
                )}
            </div>
        </div>
    );

    // UNIQUE OWNERS derived from tasks for filter dropdown
    const uniqueOwners = Array.from(
        new Map(
            tasks
                .filter((t: any) => t.assigneeId?.name)
                .map((t: any) => [t.assigneeId._id, t.assigneeId.name])
        ).entries()
    );

    // UNIQUE PROJECTS derived from tasks for filter dropdown
    const uniqueProjects = Array.from(
        new Map(
            tasks
                .filter((t: any) => t.projectId?.name)
                .map((t: any) => [t.projectId._id, t.projectId.name])
        ).entries()
    );

    // FILTERED TASKS for SHEET view
    const filteredSheetTasks = tasks.filter((task: any) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            !q ||
            task.title?.toLowerCase().includes(q) ||
            task.description?.toLowerCase().includes(q) ||
            task.assigneeId?.name?.toLowerCase().includes(q) ||
            task.projectId?.name?.toLowerCase().includes(q);

        const matchesStatus =
            !filterStatus || task.status === filterStatus;

        const matchesOwner =
            !filterOwner || task.assigneeId?._id === filterOwner;

        const matchesProject =
            !filterProject || task.projectId?._id === filterProject;

        return matchesSearch && matchesStatus && matchesOwner && matchesProject;
    });

    const hasActiveFilters =
        !!searchQuery || !!filterStatus || !!filterOwner || !!filterProject;

    const clearAllFilters = () => {
        setSearchQuery('');
        setFilterStatus('');
        setFilterOwner('');
        setFilterProject('');
    };

    // UPDATED TASK SHEET
    const TasksSheet = () => (
        <div className="space-y-4">
            {/* ── SEARCH + FILTER BAR ── */}
            <div className="flex flex-col lg:flex-row gap-3">

                    {/* SEARCH INPUT */}
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search tasks, owners, projects…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-400 bg-slate-50 hover:bg-white"
                        />
                    </div>

                    {/* FILTER ROW */}
                    <div className="flex flex-wrap gap-3">

                        {/* STATUS FILTER */}
                        <div className="relative">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className={`appearance-none pl-3 pr-8 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer transition-all ${
                                    filterStatus
                                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium'
                                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                                }`}
                            >
                                <option value="">All Status</option>
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="DONE">Done</option>
                                <option value="CLOSED">Closed</option>
                            </select>
                            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* OWNER FILTER */}
                        <div className="relative">
                            <select
                                value={filterOwner}
                                onChange={(e) => setFilterOwner(e.target.value)}
                                className={`appearance-none pl-3 pr-8 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer transition-all ${
                                    filterOwner
                                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium'
                                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                                }`}
                            >
                                <option value="">All Owners</option>
                                {uniqueOwners.map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* PROJECT FILTER */}
                        <div className="relative">
                            <select
                                value={filterProject}
                                onChange={(e) => setFilterProject(e.target.value)}
                                className={`appearance-none pl-3 pr-8 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer transition-all ${
                                    filterProject
                                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium'
                                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                                }`}
                            >
                                <option value="">All Projects</option>
                                {uniqueProjects.map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* CLEAR ALL */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                                Clear
                            </button>
                        )}
                    </div>
            </div>

            {/* RESULTS COUNT BADGE */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                        Showing
                    </span>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {filteredSheetTasks.length} of {tasks.length} tasks
                    </span>
                </div>
            )}

            {/* ── TABLE ── */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Task</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Owner</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Priority</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Status</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">EST (Hrs)</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Start Date</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Planned End</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Actual End</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Comments</th>
                                <th className="px-4 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {filteredSheetTasks.map((task: any) => (
                                <tr
                                    key={task._id}
                                    className="hover:bg-slate-50 transition-colors"
                                >
                                    {/* TASK + PROJECT */}
                                    <td className="px-4 py-4 min-w-[250px]">
                                        <div className="text-sm font-semibold text-slate-900">
                                            {task.title}
                                        </div>

                                        <div className="mt-2">
                                            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                                {task.projectId?.name || 'General'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* OWNER */}
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                                {task.assigneeId?.name?.charAt(0) || 'U'}
                                            </div>

                                            <span className="ml-2 text-sm text-slate-700">
                                                {task.assigneeId?.name || 'Unassigned'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* PRIORITY */}
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPriorityClasses(task.priority || 'MEDIUM')}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                (task.priority || 'MEDIUM') === 'HIGH' ? 'bg-rose-500' :
                                                (task.priority || 'MEDIUM') === 'MEDIUM' ? 'bg-amber-500' :
                                                'bg-emerald-500'
                                            }`} />
                                            {task.priority || 'MEDIUM'}
                                        </span>
                                    </td>

                                    {/* STATUS */}
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="relative inline-block w-32 group">
                                            <select
                                                value={task.status}
                                                onChange={(e) => updateStatus(task._id, e.target.value as any)}
                                                className={`appearance-none w-full text-[11px] font-bold rounded-full pl-3 pr-8 py-1.5 border focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 cursor-pointer transition-all shadow-sm group-hover:shadow-md ${getStatusClasses(task.status)}`}
                                            >
                                                <option value="TODO">To Do</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="DONE">Done</option>
                                                {canManage && (
                                                    <option value="CLOSED">Closed</option>
                                                )}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-current opacity-60">
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    </td>

                                    {/* EST HOURS */}
                                    <td className="px-4 py-4 text-sm text-slate-700 whitespace-nowrap">
                                        {task.estimatedHours || '-'}
                                    </td>

                                    {/* START DATE */}
                                    <td className="px-4 py-4 text-sm text-slate-700 whitespace-nowrap">
                                        {task.startDate
                                            ? new Date(task.startDate).toLocaleDateString()
                                            : '-'}
                                    </td>

                                    {/* PLANNED END */}
                                    <td className="px-4 py-4 text-sm text-slate-700 whitespace-nowrap">
                                        {task.plannedEndDate
                                            ? new Date(task.plannedEndDate).toLocaleDateString()
                                            : '-'}
                                    </td>

                                    {/* ACTUAL END */}
                                    <td className="px-4 py-4 text-sm text-slate-700 whitespace-nowrap">
                                        {task.actualEndDate
                                            ? new Date(task.actualEndDate).toLocaleDateString()
                                            : '-'}
                                    </td>

                                    {/* COMMENTS */}
                                    <td className="px-4 py-4 text-sm text-slate-600 min-w-[220px]">
                                        {task.comments || '-'}
                                    </td>

                                    {/* ACTION */}
                                    <td className="px-4 py-4 text-right whitespace-nowrap">
                                        {canManage && (
                                            <button
                                                onClick={() => openEditModal(task)}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredSheetTasks.length === 0 && (
                    <div className="py-16 text-center">
                        <Search className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">
                            {hasActiveFilters ? 'No tasks match your filters' : 'No tasks found'}
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Tasks
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Track and manage project deliverables.
                    </p>
                </div>

                <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                    <button
                        onClick={() =>
                            navigate('/task-history')
                        }
                        className="flex items-center bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium"
                    >
                        <History className="h-5 w-5 mr-1.5 text-slate-500" />
                        Task History
                    </button>

                    <button
                        onClick={() => {
                            resetForm();
                            setIsModalOpen(true);
                        }}
                        className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
                    >
                        <Plus className="h-5 w-5 mr-1.5" />
                        New Task
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() =>
                        setActiveTab('KANBAN')
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'KANBAN'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Tasks
                </button>

                <button
                    onClick={() =>
                        setActiveTab('SHEET')
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'SHEET'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Tasks Sheet
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : activeTab === 'KANBAN' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KanbanColumn
                        title="To Do"
                        tasks={todoTasks}
                        icon={Clock}
                        colorClass="text-slate-700"
                    />

                    <KanbanColumn
                        title="In Progress"
                        tasks={inProgressTasks}
                        icon={PlayCircle}
                        colorClass="text-amber-600"
                    />

                    <KanbanColumn
                        title="Done"
                        tasks={doneTasks}
                        icon={CheckCircle2}
                        colorClass="text-emerald-600"
                    />
                </div>
            ) : (
                <TasksSheet />
            )}

            {/* MODAL */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title={
                    editingTaskId
                        ? 'Edit Task'
                        : 'Create New Task'
                }
            >
                <form
                    onSubmit={handleSaveTask}
                    className="space-y-4"
                >
                    {/* ROW 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Project
                            </label>

                            <select
                                value={selectedProject}
                                onChange={(e) =>
                                    setSelectedProject(
                                        e.target.value
                                    )
                                }
                                className="mt-1 w-full rounded-lg border-slate-300 shadow-sm p-2 border"
                            >
                                <option value="">
                                    General / No Project
                                </option>

                                {projects.map((p) => (
                                    <option
                                        key={p._id}
                                        value={p._id}
                                    >
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Task
                            </label>

                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) =>
                                    setTitle(
                                        e.target.value
                                    )
                                }
                                className="mt-1 w-full rounded-lg border-slate-300 shadow-sm p-2 border"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Owner
                            </label>

                            <select
                                value={assigneeId}
                                onChange={(e) =>
                                    setAssigneeId(
                                        e.target.value
                                    )
                                }
                                className="mt-1 w-full rounded-lg border-slate-300 shadow-sm p-2 border"
                            >
                                <option value="">
                                    Select Owner
                                </option>

                                {selectedProject ? (
                                    (() => {
                                        const projectEmployees = projects.find(p => p._id === selectedProject)?.employees || [];
                                        const adminStaff = allEmployees.filter(emp => {
                                            const role = emp.role || (emp.userId as any)?.role;
                                            const isHRorManager = role === 'HR' || role === 'MANAGER';
                                            const isAlreadyInProject = projectEmployees.some((pe: any) => pe._id === emp._id);
                                            return isHRorManager && !isAlreadyInProject;
                                        });

                                        return (
                                            <>
                                                {projectEmployees.map((emp: any) => (
                                                    <option key={emp._id} value={emp._id}>
                                                        {emp.name}
                                                    </option>
                                                ))}
                                                {adminStaff.map((emp) => (
                                                    <option key={emp._id} value={emp._id}>
                                                        {emp.name} ({emp.role || (emp.userId as any)?.role})
                                                    </option>
                                                ))}
                                            </>
                                        );
                                    })()
                                ) : (
                                    allEmployees
                                        .filter(emp => {
                                            const role = emp.role || (emp.userId as any)?.role;
                                            return role === 'HR' || role === 'MANAGER';
                                        })
                                        .map((emp) => (
                                            <option
                                                key={emp._id}
                                                value={emp._id}
                                            >
                                                {emp.name} ({emp.role || (emp.userId as any)?.role})
                                            </option>
                                        ))
                                )}
                            </select>
                        </div>
                    </div>

                    {/* ROW 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Priority
                            </label>

                            <select
                                value={priority}
                                onChange={(e) =>
                                    setPriority(
                                        e.target.value
                                    )
                                }
                                className="mt-1 w-full rounded-lg border-slate-300 shadow-sm p-2 border"
                            >
                                <option value="LOW">
                                    LOW
                                </option>

                                <option value="MEDIUM">
                                    MEDIUM
                                </option>

                                <option value="HIGH">
                                    HIGH
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                EST (Hours)
                            </label>

                            <input
                                type="number"
                                value={estimatedHours}
                                onChange={(e) =>
                                    setEstimatedHours(
                                        e.target.value
                                    )
                                }
                                className="mt-1 w-full rounded-lg border-slate-300 shadow-sm p-2 border"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Deadline
                            </label>

                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) =>
                                    setDeadline(
                                        e.target.value
                                    )
                                }
                                className="mt-1 w-full rounded-lg border-slate-300 shadow-sm p-2 border"
                            />
                        </div>
                    </div>

                    {/* ROW 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Start Date
                            </label>

                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) =>
                                    setStartDate(
                                        e.target.value
                                    )
                                }
                                className="mt-1 w-full rounded-lg border-slate-300 shadow-sm p-2 border"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Planned End Date
                            </label>

                            <input
                                type="date"
                                value={plannedEndDate}
                                onChange={(e) =>
                                    setPlannedEndDate(
                                        e.target.value
                                    )
                                }
                                className="mt-1 w-full rounded-lg border-slate-300 shadow-sm p-2 border"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Actual End Date
                            </label>

                            <input
                                type="date"
                                value={actualEndDate}
                                onChange={(e) =>
                                    setActualEndDate(
                                        e.target.value
                                    )
                                }
                                className="mt-1 w-full rounded-lg border-slate-300 shadow-sm p-2 border"
                            />
                        </div>
                    </div>

                    {/* DESCRIPTION */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Description
                        </label>

                        <textarea
                            rows={3}
                            required
                            value={description}
                            onChange={(e) =>
                                setDescription(
                                    e.target.value
                                )
                            }
                            className="mt-1 w-full rounded-lg border-slate-300 shadow-sm p-2 border"
                        />
                    </div>

                    {/* COMMENTS */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Comments
                        </label>

                        <textarea
                            rows={3}
                            value={comments}
                            onChange={(e) =>
                                setComments(
                                    e.target.value
                                )
                            }
                            className="mt-1 w-full rounded-lg border-slate-300 shadow-sm p-2 border"
                        />
                    </div>

                    <div className="mt-5 sm:grid sm:grid-cols-2 sm:gap-3">
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                            {editingTaskId
                                ? 'Save Changes'
                                : 'Create Task'}
                        </button>

                        <button
                            type="button"
                            onClick={handleModalClose}
                            className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-4 py-2 bg-white text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};