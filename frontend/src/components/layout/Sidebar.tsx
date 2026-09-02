import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { X, User as UserIcon } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../features/auth/store/authStore';

export interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  group?: string;
}

interface SidebarProps {
  navItems: NavItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ navItems, isOpen, setIsOpen }) => {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Close on Escape for mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Prevent scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const sidebarContent = (
    <div
      ref={sidebarRef}
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen md:sticky md:top-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Brand Area */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-14 h-14 object-contain -ml-2" 
            />
            <span className="font-bold text-slate-900 text-lg tracking-tight">PeerReview AI</span>
          </div>
          {/* Mobile close button inside the same header */}
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-gray-500 rounded-md hover:bg-gray-100 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin">
          {Object.entries(
            navItems.reduce((acc, item) => {
              const group = item.group || '';
              if (!acc[group]) acc[group] = [];
              acc[group].push(item);
              return acc;
            }, {} as Record<string, NavItem[]>)
          ).map(([group, items]) => (
            <div key={group || 'ungrouped'} className="mb-6 last:mb-0">
              {group && (
                <div className="px-4 mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                  {group}
                </div>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group relative overflow-hidden",
                        isActive
                          ? "bg-brand-soft-bg text-brand-primary"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary" />
                      )}
                      <item.icon
                        className={cn(
                          "mr-3 flex-shrink-0 h-5 w-5 transition-colors",
                          isActive ? "text-brand-primary" : "text-slate-400 group-hover:text-slate-500"
                        )}
                      />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Status / User Info */}
        <div className="shrink-0 p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center justify-center w-10 h-10 bg-brand-soft-bg text-brand-primary rounded-full overflow-hidden shrink-0 border border-brand-primary/20">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-bold text-slate-900 truncate">{user?.full_name}</span>
              <span className="text-xs text-slate-500 font-medium truncate flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0"></span>
                {user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'TEACHER' ? 'Giảng viên' : 'Sinh viên'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />,
        document.body
      )}
      
      {/* Sidebar Content */}
      {sidebarContent}
    </>
  );
};
