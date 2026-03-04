import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskService, Task } from '../services/taskService';
import { projectService, Project } from '../services/projectService';
import { ArrowLeft, Search, CalendarClock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TaskHistory: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [assigneeSearch, setAssigneeSearch] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, [selectedProject]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [tasksData, projectsData] = await Promise.all([
                // Fetch all tasks for history, or just CLOSED ones? The user asked for "history of all tasks". Let's fetch ALL tasks and let the user see their history, but typically task history implies all tasks including closed, maybe filterable. Or just closed ones. Let's fetch ALL, but display CLOSED ones, or just all. I'll fetch ALL and display all.
                taskService.getAll(selectedProject || undefined, undefined, 'ALL'),
                projectService.getAll()
            ]);
            setTasks(tasksData);
            setProjects(projectsData);
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
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Task Info</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Project</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assignee</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Deadline</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {filteredTasks.map(task => (
                                        <tr key={task._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-900">{task.title}</div>
                                                <div className="text-xs text-slate-500 line-clamp-1 mt-0.5 max-w-xs">{task.description}</div>
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
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.status === 'DONE' ? 'bg-emerald-100 text-emerald-800' :
                                                        task.status === 'CLOSED' ? 'bg-slate-100 text-slate-800' :
                                                            task.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                                                                'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {task.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">
                                                {task.deadline ? (
                                                    <div className="flex items-center justify-end text-slate-600">
                                                        <CalendarClock className="w-3.5 h-3.5 mr-1" />
                                                        {new Date(task.deadline).toLocaleDateString()}
                                                    </div>
                                                ) : <span className="text-slate-400">No deadline</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
