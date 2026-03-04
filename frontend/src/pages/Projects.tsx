import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projectService, Project } from '../services/projectService';
import { employeeService, Employee } from '../services/employeeService';
import { FolderKanban, Plus, Users, Clock, Edit2, Trash2 } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

export const Projects: React.FC = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

    const canManage = user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [projData, empData] = await Promise.all([
                projectService.getAll(),
                canManage ? employeeService.getAll({}) : Promise.resolve({ data: [] }),
            ]);
            setProjects(projData);
            if (canManage) {
                setEmployees(empData.data);
            }
        } catch (error) {
            console.error('Failed to fetch projects', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (project?: Project) => {
        if (project) {
            setEditingProject(project);
            setName(project.name);
            setDescription(project.description);
            setSelectedEmployees(project.employees.map(e => e._id));
        } else {
            setEditingProject(null);
            setName('');
            setDescription('');
            setSelectedEmployees([]);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProject) {
                await projectService.update(editingProject._id, { name, description, employees: selectedEmployees });
                toast.success('Project updated');
            } else {
                await projectService.create({ name, description, employees: selectedEmployees });
                toast.success('Project created');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Action failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Delete this project?')) {
            try {
                await projectService.delete(id);
                toast.success('Project deleted');
                fetchData();
            } catch (error) {
                toast.error('Failed to delete project');
            }
        }
    };

    const toggleEmployee = (empId: string) => {
        if (selectedEmployees.includes(empId)) {
            setSelectedEmployees(selectedEmployees.filter(id => id !== empId));
        } else {
            setSelectedEmployees([...selectedEmployees, empId]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Projects</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {canManage ? 'Manage company projects and assignments.' : 'View your assigned projects.'}
                    </p>
                </div>
                {canManage && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="mt-4 sm:mt-0 flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
                    >
                        <Plus className="h-5 w-5 mr-1.5" />
                        Create Project
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
            ) : projects.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <FolderKanban className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">No projects found</h3>
                    <p className="text-slate-500">There are no projects assigned to you.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <div key={project._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-slate-900">{project.name}</h3>
                                    {canManage && (
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleOpenModal(project)} className="text-indigo-600 hover:text-indigo-800"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(project._id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 mb-6">{project.description}</p>

                                <div className="flex items-center text-sm text-slate-500 mb-2">
                                    <Users className="w-4 h-4 mr-2" />
                                    {project.employees.length} Members Assigned
                                </div>

                                <div className="flex -space-x-2 overflow-hidden mt-3">
                                    {project.employees.slice(0, 5).map(emp => (
                                        <div key={emp._id} className="inline-block h-8 w-8 rounded-full bg-slate-200 ring-2 ring-white flex items-center justify-center text-xs font-bold text-slate-600" title={emp.name}>
                                            {emp.name?.charAt(0) || 'U'}
                                        </div>
                                    ))}
                                    {project.employees.length > 5 && (
                                        <div className="inline-block h-8 w-8 rounded-full bg-slate-100 ring-2 ring-white flex items-center justify-center text-xs font-bold text-slate-600">
                                            +{project.employees.length - 5}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100">
                                <a href={`/tasks?project=${project._id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
                                    <FolderKanban className="w-4 h-4 mr-2" /> View Tasks
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProject ? 'Edit Project' : 'Create Project'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Project Name</label>
                        <input type="text" required value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Description</label>
                        <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                    </div>
                    {canManage && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Assign Employees</label>
                            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-1">
                                {employees.map(emp => (
                                    <label key={emp._id} className="flex items-center p-2 hover:bg-white rounded cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={selectedEmployees.includes(emp._id)}
                                            onChange={() => toggleEmployee(emp._id)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-3 text-sm text-slate-700 font-medium">{emp.name}</span>
                                        <span className="ml-auto text-xs text-slate-400">{emp.department}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <button type="submit" className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm">
                            {editingProject ? 'Save Changes' : 'Create Project'}
                        </button>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm">
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
