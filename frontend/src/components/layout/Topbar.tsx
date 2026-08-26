import React from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../features/auth/store/authStore';
import { Button } from '../ui/Button';
import { layoutMessages } from '../../constants/messages/layout';

interface TopbarProps {
  onOpenSidebar: () => void;
  badge?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenSidebar, badge }) => {
  const { user, logout } = useAuthStore();

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
          <span className="text-xl font-bold text-gray-900 hidden sm:block">PeerReview AI</span>
          {badge && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {badge}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-gray-900">{user?.full_name}</span>
          <span className="text-xs text-gray-500">{user?.role}</span>
        </div>
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-700 rounded-full">
          <User className="w-5 h-5" />
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => logout()}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{layoutMessages.action.logout}</span>
        </Button>
      </div>
    </header>
  );
};
