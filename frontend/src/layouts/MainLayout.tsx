import React from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building, Users, Home, Settings, LogOut, Menu, FolderKanban, CheckSquare } from 'lucide-react';
import { NotificationDropdown } from '../components/NotificationDropdown';

export const MainLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <Building className="h-6 w-6 text-indigo-400 mr-2" />
                    <span className="text-lg font-bold">Workzen HRMS Portal</span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    {user?.role !== 'SUPERADMIN' && (
                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600/10 text-indigo-400 font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'}`
                            }
                        >
                            <Home className="h-5 w-5 mr-3" />
                            <span>Dashboard</span>
                        </NavLink>
                    )}
                    {user?.role === 'SUPERADMIN' && (
                        <>
                            <NavLink
                                to="/organizations"
                                className={({ isActive }) =>
                                    `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600/10 text-indigo-400 font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'}`
                                }
                            >
                                <Building className="h-5 w-5 mr-3" />
                                <span>Organizations</span>
                            </NavLink>
                            <NavLink
                                to="/users"
                                className={({ isActive }) =>
                                    `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600/10 text-indigo-400 font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'}`
                                }
                            >
                                <Users className="h-5 w-5 mr-3" />
                                <span>Global Users</span>
                            </NavLink>
                        </>
                    )}
                    {user?.role !== 'SUPERADMIN' && (
                        <>
                            <NavLink
                                to="/projects"
                                className={({ isActive }) =>
                                    `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600/10 text-indigo-400 font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'}`
                                }
                            >
                                <FolderKanban className="h-5 w-5 mr-3" />
                                <span>Projects</span>
                            </NavLink>
                            <NavLink
                                to="/tasks"
                                className={({ isActive }) =>
                                    `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600/10 text-indigo-400 font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'}`
                                }
                            >
                                <CheckSquare className="h-5 w-5 mr-3" />
                                <span>Tasks</span>
                            </NavLink>
                        </>
                    )}
                    {user?.role !== 'SUPERADMIN' && (
                        <NavLink
                            to="/employees"
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600/10 text-indigo-400 font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'}`
                            }
                        >
                            <Users className="h-5 w-5 mr-3" />
                            <span>{user?.role === 'EMPLOYEE' ? 'Directory' : 'Employees'}</span>
                        </NavLink>
                    )}
                    {user?.role !== 'EMPLOYEE' && user?.role !== 'SUPERADMIN' && (
                        <NavLink
                            to="/attendance"
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600/10 text-indigo-400 font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'}`
                            }
                        >
                            <Building className="h-5 w-5 mr-3" />
                            <span>Attendance</span>
                        </NavLink>
                    )}
                    {user?.role !== 'SUPERADMIN' && (
                        <NavLink
                            to="/leaves"
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600/10 text-indigo-400 font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'}`
                            }
                        >
                            <Settings className="h-5 w-5 mr-3" />
                            <span>Leaves</span>
                        </NavLink>
                    )}
                    {user?.role !== 'SUPERADMIN' && user?.role !== 'EMPLOYEE' && (
                        <NavLink
                            to="/settings"
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600/10 text-indigo-400 font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'}`
                            }
                        >
                            <Settings className="h-5 w-5 mr-3" />
                            <span>Settings</span>
                        </NavLink>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center mb-4">
                        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-medium">
                            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
                            <p className="text-xs text-slate-400">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center md:hidden">
                        <Menu className="h-6 w-6 text-gray-500 mr-4 cursor-pointer" />
                        <Building className="h-6 w-6 text-indigo-600" />
                        <span className="ml-2 font-bold text-gray-900">Workzen</span>
                        {user?.organizationName && (
                            <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded hidden sm:inline-block">
                                {user.organizationName}
                            </span>
                        )}
                    </div>
                    <div className="hidden md:flex flex-1 items-center space-x-4">
                        {user?.organizationName && (
                            <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                {user.organizationName}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-4">
                        <NotificationDropdown />
                        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-medium text-white md:hidden">
                            {user?.firstName?.charAt(0)}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
