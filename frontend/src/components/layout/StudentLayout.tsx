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
  },
  {
    icon: MessageSquare,
    label: layoutMessages.navigation.reviews,
    href: '/student/reviews',
  },
  {
    icon: User,
    label: layoutMessages.navigation.profile,
    href: '/student/profile',
  },
];

export const StudentLayout: React.FC = () => {
  return <AppLayout navItems={studentNavItems} />;
};
