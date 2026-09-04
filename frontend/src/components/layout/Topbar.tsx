import React from 'react';
import { Menu, LogOut, Zap } from 'lucide-react';
import { useAuthStore } from '../../features/auth/store/authStore';
import { Button } from '../ui/Button';

interface TopbarProps {
  onOpenSidebar: () => void;
  badge?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenSidebar, badge }) => {
  const { logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-white px-4 shadow-sm border-b border-gray-200">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 text-gray-500 rounded-md md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-12 w-auto object-contain md:hidden -ml-2" 
          />
          {badge && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <Zap size={14} className="text-red-600" />
              {badge}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => logout()}
          className="text-slate-500 hover:text-rose-600"
          title="Đăng xuất"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};
