import React from 'react';
import { LayoutDashboard, MessageSquare, User, Users } from 'lucide-react';
import { AppLayout } from './AppLayout';
import { layoutMessages } from '../../constants/messages/layout';

const studentNavItems = [
  {
    icon: LayoutDashboard,
    label: layoutMessages.navigation.dashboard,
    href: '/student/dashboard',
  },
  {
    icon: Users,
    label: layoutMessages.navigation.classes,
    href: '/student/classes',
    group: 'Management',
  },
  {
    icon: MessageSquare,
    label: layoutMessages.navigation.reviews,
    href: '/student/reviews',
    group: 'Management',
  },
  {
    icon: User,
    label: layoutMessages.navigation.profile,
    href: '/student/profile',
    group: 'System',
  },
];

export const StudentLayout: React.FC = () => {
  return <AppLayout navItems={studentNavItems} />;
};
