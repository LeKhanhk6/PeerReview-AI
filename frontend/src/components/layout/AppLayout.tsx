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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Handles both mobile drawer and desktop fixed layout internally */}
      <Sidebar 
        navItems={navItems} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <Topbar 
          onOpenSidebar={() => setIsSidebarOpen(true)} 
          badge={badge}
        />
        
        <main className="flex-1 flex flex-col min-h-0 min-w-0 p-3 sm:p-4 md:p-5">
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0 min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
