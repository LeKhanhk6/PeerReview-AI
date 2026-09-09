import React from 'react';
import { LayoutDashboard, BookOpen, Users, BarChart3 } from 'lucide-react';
import { AppLayout } from './AppLayout';
import { layoutMessages } from '../../constants/messages/layout';

const teacherNavItems = [
  {
    icon: LayoutDashboard,
    label: layoutMessages.navigation.dashboard,
    href: '/teacher/dashboard',
  },
  {
    icon: Users,
    label: layoutMessages.navigation.classes,
    href: '/teacher/classes',
    group: layoutMessages.groups.management,
  },
  {
    icon: BookOpen,
    label: layoutMessages.navigation.assignments,
    href: '/teacher/assignments',
    group: layoutMessages.groups.management,
  },
  {
    icon: BarChart3,
    label: layoutMessages.navigation.analytics,
    href: '/teacher/analytics',
    group: layoutMessages.groups.system,
  },
];

export const TeacherLayout: React.FC = () => {
  return <AppLayout navItems={teacherNavItems} />;
};
