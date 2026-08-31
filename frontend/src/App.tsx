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
import { StudentDashboardPage } from './features/student-dashboard/pages/StudentDashboardPage';
import { StudentClassesPage } from './features/classes/pages/StudentClassesPage';
import { TeacherAssignmentsPage } from './features/assignment/pages/TeacherAssignmentsPage';
import { CreateAssignmentPage } from './features/assignment/pages/CreateAssignmentPage';
import { EditAssignmentPage } from './features/assignment/pages/EditAssignmentPage';
import { TeacherAnalyticsDashboardPage } from './features/analytics/pages/TeacherAnalyticsDashboardPage';
import { TeacherDashboardPage } from './features/analytics/pages/TeacherDashboardPage';
import { TeacherReviewSynthesisPage } from './features/synthesis/pages/TeacherReviewSynthesisPage';
import { TeacherSubmissionsMonitorPage } from './features/submission/pages/TeacherSubmissionsMonitorPage';
import { StudentGroupWorkspacePage } from './features/workspace/pages/StudentGroupWorkspacePage';
import { StudentSubmissionPage } from './features/submission/pages/StudentSubmissionPage';

import { ReviewInboxScreen } from './features/review/components/ReviewInboxScreen';
import { ReviewWritingScreen } from './features/review/components/ReviewWritingScreen';

import { AdminDashboardPage } from './features/admin/pages/AdminDashboardPage';
import { AdminUsersPage } from './features/admin/pages/AdminUsersPage';
import { AdminAuditLogsPage } from './features/admin/pages/AdminAuditLogsPage';
import { AdminSettingsPage } from './features/admin/pages/AdminSettingsPage';
import { ProfilePage } from './features/auth/pages/ProfilePage';

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <NetworkBanner />
      <Toaster />
      <Router>
        <Routes>
          {/* Public Routes */}
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
            <Route path="dashboard" element={<StudentDashboardPage />} />
            <Route path="classes" element={<StudentClassesPage />} />
            <Route path="assignments" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="assignments/:assignmentId/workspace" element={<StudentGroupWorkspacePage />} />
            <Route path="assignments/:assignmentId/submit" element={<StudentSubmissionPage />} />
            
            {/* Peer Review Sub-routes */}
            <Route path="reviews" element={<ReviewInboxScreen />} />
            <Route path="reviews/:reviewAssignmentId" element={<ReviewWritingScreen />} />
            <Route path="profile" element={<ProfilePage />} />

            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Teacher Routes (Accessible by TEACHER & ADMIN) */}
          <Route 
            path="/teacher" 
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['TEACHER', 'ADMIN']}>
                  <TeacherLayout />
                </RoleRoute>
              </ProtectedRoute>
            } 
          >
            <Route path="dashboard" element={<TeacherDashboardPage />} />
            <Route path="classes" element={<TeacherClassesPage />} />
            <Route path="classes/:id" element={<TeacherClassDetailPage />} />
            <Route path="assignments" element={<TeacherAssignmentsPage />} />
            <Route path="assignments/new" element={<CreateAssignmentPage />} />
            <Route path="assignments/:id/edit" element={<EditAssignmentPage />} />
            <Route path="assignments/:assignmentId/submissions" element={<TeacherSubmissionsMonitorPage />} />
            <Route path="assignments/:assignmentId/synthesis" element={<TeacherReviewSynthesisPage />} />
            <Route path="analytics" element={<TeacherAnalyticsDashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
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
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
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
