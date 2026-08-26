import React from 'react';
import { LayoutDashboard, BookOpen, FileCheck } from 'lucide-react';
import { AppLayout } from './AppLayout';
import { layoutMessages } from '../../constants/messages/layout';

const teacherNavItems = [
  {
    icon: LayoutDashboard,
    label: layoutMessages.navigation.dashboard,
    href: '/teacher/dashboard',
  },
  {
    icon: BookOpen,
    label: layoutMessages.navigation.assignments,
    href: '/teacher/assignments',
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
