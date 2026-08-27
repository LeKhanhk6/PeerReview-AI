import React from 'react';
import { LayoutDashboard, BookOpen, FileCheck, Users, BarChart3 } from 'lucide-react';
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
  },
  {
    icon: BookOpen,
    label: layoutMessages.navigation.assignments,
    href: '/teacher/assignments',
  },
  {
    icon: BarChart3,
    label: layoutMessages.navigation.analytics,
    href: '/teacher/analytics',
  },
  {
    icon: FileCheck,
    label: layoutMessages.navigation.submissions,
    href: '/teacher/submissions',
  },
];

export const TeacherLayout: React.FC = () => {
  return <AppLayout navItems={teacherNavItems} />;
};
