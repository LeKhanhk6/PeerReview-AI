import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { NetworkBanner } from './components/common/NetworkBanner/NetworkBanner';
import { Toaster } from './components/ui/Toaster';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './features/auth/store/authStore';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { RoleRoute } from './features/auth/components/RoleRoute';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { StudentLayout } from './components/layout/StudentLayout';
import { TeacherLayout } from './components/layout/TeacherLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { TeacherClassesPage } from './features/classes/pages/TeacherClassesPage';
import { TeacherClassDetailPage } from './features/classes/pages/TeacherClassDetailPage';
import { StudentClassesPage } from './features/classes/pages/StudentClassesPage';

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <NetworkBanner />
        <Toaster />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Student Routes */}
          <Route 
            path="/student" 
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['STUDENT']}>
                  <StudentLayout />
                </RoleRoute>
              </ProtectedRoute>
            } 
          >
            <Route path="dashboard" element={<div>Student Dashboard</div>} />
            <Route path="classes" element={<StudentClassesPage />} />
            <Route path="classes/:id" element={<div>Student Class Workspace</div>} />
            <Route path="reviews" element={<div>Student Reviews</div>} />
            <Route path="profile" element={<div>Student Profile</div>} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Teacher Routes */}
          <Route 
            path="/teacher" 
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['TEACHER']}>
                  <TeacherLayout />
                </RoleRoute>
              </ProtectedRoute>
            } 
          >
            <Route path="dashboard" element={<div>Teacher Dashboard</div>} />
            <Route path="classes" element={<TeacherClassesPage />} />
            <Route path="classes/:id" element={<TeacherClassDetailPage />} />
            <Route path="assignments" element={<div>Teacher Assignments</div>} />
            <Route path="submissions" element={<div>Teacher Submissions</div>} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminLayout />
                </RoleRoute>
              </ProtectedRoute>
            } 
          >
            <Route path="dashboard" element={<div>Admin Dashboard</div>} />
            <Route path="users" element={<div>Admin Users</div>} />
            <Route path="settings" element={<div>Admin Settings</div>} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Fallback routing based on role or to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
