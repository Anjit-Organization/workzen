import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Leaves } from './pages/Leaves';
import { Attendance } from './pages/Attendance';
import { Settings } from './pages/Settings';
import { Projects } from './pages/Projects';
import { Tasks } from './pages/Tasks';
import { OrganizationDetails } from './pages/OrganizationDetails';
import { GlobalUsers } from './pages/GlobalUsers';

import { Toaster } from 'react-hot-toast';
import { Organizations } from './pages/Organizations';
import { EmployeeProfile } from './pages/EmployeeProfile';

function App() {
    return (
        <AuthProvider>
            <Toaster position="top-right" />
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Protected Routes Wrapper */}
                    <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="employees" element={<Employees />} />
                        <Route path="employees/:id" element={<EmployeeProfile />} />
                        <Route path="leaves" element={<Leaves />} />
                        <Route path="attendance" element={<Attendance />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="organizations" element={<Organizations />} />
                        <Route path="organizations/:id" element={<OrganizationDetails />} />
                        <Route path="users" element={<GlobalUsers />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="tasks" element={<Tasks />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
