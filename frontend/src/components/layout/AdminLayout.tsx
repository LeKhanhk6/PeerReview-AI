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
    group: 'Management',
  },
  {
    icon: FileText,
    label: 'Audit Logs',
    href: '/admin/audit-logs',
    group: 'System',
  },
  {
    icon: Settings,
    label: layoutMessages.navigation.settings,
    href: '/admin/settings',
    group: 'System',
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
