import React from 'react';
import { LayoutDashboard, Users, FileText, Settings } from 'lucide-react';
import { AppLayout } from './AppLayout';
import { layoutMessages } from '../../constants/messages/layout';

const adminNavItems = [
  {
    icon: LayoutDashboard,
    label: layoutMessages.navigation.dashboard,
    href: '/admin/dashboard',
  },
  {
    icon: Users,
    label: layoutMessages.navigation.users,
    href: '/admin/users',
    group: layoutMessages.groups.management,
  },
  {
    icon: FileText,
    label: layoutMessages.navigation.auditLogs,
    href: '/admin/audit-logs',
    group: layoutMessages.groups.system,
  },
  {
    icon: Settings,
    label: layoutMessages.navigation.settings,
    href: '/admin/settings',
    group: layoutMessages.groups.system,
  },
];


export const AdminLayout: React.FC = () => {
  return (
    <AppLayout 
      navItems={adminNavItems} 
      badge={layoutMessages.admin.badge}
    />
  );
};
