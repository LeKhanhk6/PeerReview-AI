import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import type { NavItem } from './Sidebar';
import { Topbar } from './Topbar';

interface AppLayoutProps {
  navItems: NavItem[];
  badge?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ navItems, badge }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Handles both mobile drawer and desktop fixed layout internally */}
      <Sidebar 
        navItems={navItems} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar 
          onOpenSidebar={() => setIsSidebarOpen(true)} 
          badge={badge}
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
