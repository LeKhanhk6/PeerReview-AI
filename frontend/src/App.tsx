import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { NetworkBanner } from './components/common/NetworkBanner/NetworkBanner';
import { Toaster } from './components/ui/Toaster';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './features/auth/store/authStore';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';

const appName = "PeerReview-AI";

const DashboardPlaceholder = () => {
  const { user, logout } = useAuthStore();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-4">{appName} - Dashboard</h1>
      <p className="mb-4">Welcome, {user?.full_name} ({user?.role})</p>
      <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded">Logout</button>
    </div>
  );
};

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
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPlaceholder />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
