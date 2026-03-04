import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskService, Task } from '../services/taskService';
import { projectService, Project } from '../services/projectService';
import { useSearchParams } from 'react-router-dom';
import { Plus, CheckCircle2, Clock, PlayCircle, Calendar, CalendarClock } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

export const Tasks: React.FC = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const projectIdFilter = searchParams.get('project');

    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [deadline, setDeadline] = useState('');

    const canManage = user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER';

    useEffect(() => {
        fetchData();
    }, [projectIdFilter]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [tasksData, projectsData] = await Promise.all([
                taskService.getAll(projectIdFilter || undefined),
                projectService.getAll()
            ]);
            setTasks(tasksData);
            setProjects(projectsData);
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                title,
                description,
                projectId: selectedProject,
                assigneeId: assigneeId || undefined,
                deadline: deadline || undefined
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
            toast.error(error.response?.data?.message || `Failed to ${editingTaskId ? 'update' : 'create'} task`);
        }
    };

    const openEditModal = (task: Task) => {
        setEditingTaskId(task._id);
        setTitle(task.title);
        setDescription(task.description);
        setSelectedProject(task.projectId._id || task.projectId as string);
        setAssigneeId(task.assigneeId?._id || task.assigneeId as string || '');
        setDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '');
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingTaskId(null);
        setTitle('');
        setDescription('');
        setSelectedProject('');
        setAssigneeId('');
        setDeadline('');
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const updateStatus = async (id: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
        try {
            await taskService.update(id, { status });
            toast.success('Status updated');
            fetchData();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    // Derived states for Kanban
    const todoTasks = tasks.filter(t => t.status === 'TODO');
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
    const doneTasks = tasks.filter(t => t.status === 'DONE');

    const KanbanColumn = ({ title, tasks, icon: Icon, colorClass }: any) => (
        <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 min-h-[500px] flex flex-col">
            <h3 className={`font-semibold mb-4 flex items-center ${colorClass}`}>
                <Icon className="w-5 h-5 mr-2" /> {title} ({tasks.length})
            </h3>
            <div className="space-y-4 flex-1">
                {tasks.map((task: Task) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const deadline = task.deadline ? new Date(task.deadline) : null;
                    deadline?.setHours(0, 0, 0, 0);

                    const isOverdue =
                        deadline &&
                        deadline < today &&
                        task.status !== 'DONE';

                    const isApproaching =
                        deadline &&
                        deadline > today &&
                        deadline.getTime() - today.getTime() <= 48 * 60 * 60 * 1000 &&
                        task.status !== 'DONE';
                    const cardBg = isOverdue ? 'bg-red-50 border-red-300' : isApproaching ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200';
                    const dlColor = isOverdue ? 'text-red-700 bg-red-100' : isApproaching ? 'text-amber-700 bg-amber-100' : 'text-amber-600 bg-amber-50';

                    return (
                        <div key={task._id} className={`p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow ${cardBg}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                    {task.projectId?.name || 'Unknown Project'}
                                </span>
                            </div>
                            <h4 className="font-bold text-slate-900 mb-1">{task.title}</h4>
                            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{task.description}</p>

                            {task.deadline && (
                                <div className={`flex items-center text-xs font-medium mb-3 self-start px-2 py-1 rounded w-fit ${dlColor}`}>
                                    <CalendarClock className="w-3 h-3 mr-1" />
                                    Due {new Date(task.deadline).toLocaleDateString()}
                                </div>
                            )}

                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold title">
                                            {task.assigneeId?.name?.charAt(0) || 'U'}
                                        </div>
                                        <span className="text-xs text-slate-500 ml-2 truncate max-w-[120px]">
                                            {task.assigneeId?.name || 'Unassigned'}
                                        </span>
                                    </div>
                                    {canManage && (
                                        <button
                                            onClick={() => openEditModal(task)}
                                            className="text-indigo-600 hover:text-indigo-800 text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Status Actions */}
                            <div className="flex space-x-1 mt-3">
                                {task.status !== 'TODO' && (
                                    <button onClick={() => updateStatus(task._id, 'TODO')} className="flex-1 text-[10px] font-medium py-1.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Todo</button>
                                )}
                                {task.status !== 'IN_PROGRESS' && (
                                    <button onClick={() => updateStatus(task._id, 'IN_PROGRESS')} className="flex-1 text-[10px] font-medium py-1.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">Start</button>
                                )}
                                {task.status !== 'DONE' && (
                                    <button onClick={() => updateStatus(task._id, 'DONE')} className="flex-1 text-[10px] font-medium py-1.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">Complete</button>
                                )}
                            </div>
                        </div>
                    )
                })}
                {tasks.length === 0 && (
                    <div className="h-full flex items-center justify-center text-sm text-slate-400 italic">No tasks</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tasks</h1>
                    <p className="mt-1 text-sm text-slate-500">Track and manage project deliverables.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="mt-4 sm:mt-0 flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
                >
                    <Plus className="h-5 w-5 mr-1.5" />
                    New Task
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KanbanColumn title="To Do" tasks={todoTasks} icon={Clock} colorClass="text-slate-700" />
                    <KanbanColumn title="In Progress" tasks={inProgressTasks} icon={PlayCircle} colorClass="text-amber-600" />
                    <KanbanColumn title="Done" tasks={doneTasks} icon={CheckCircle2} colorClass="text-emerald-600" />
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleModalClose} title={editingTaskId ? "Edit Task" : "Create New Task"}>
                <form onSubmit={handleSaveTask} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Project</label>
                        <select required value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="mt-1 w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                            <option value="">Select a project</option>
                            {projects.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Task Title</label>
                        <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Description</label>
                        <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Deadline (Optional)</label>
                        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="mt-1 w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                    </div>
                    {canManage && selectedProject && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Assign To</label>
                            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="mt-1 w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                                <option value="">Self / Unassigned</option>
                                {projects.find(p => p._id === selectedProject)?.employees.map((emp: any) => (
                                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <button type="submit" className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm transition-colors">
                            {editingTaskId ? 'Save Changes' : 'Create Task'}
                        </button>
                        <button type="button" onClick={handleModalClose} className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm transition-colors">
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
