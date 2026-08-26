import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { Role } from '../types';
import { NoPermissionState } from '@/components/ui/EmptyState';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles }) => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <NoPermissionState
          title="Access Denied"
          description="You do not have permission to view this page."
        />
      </div>
    );
  }

  return <>{children}</>;
};
