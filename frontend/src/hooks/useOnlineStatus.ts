import { useState, useEffect } from 'react';
import { onlineManager } from '@tanstack/react-query';
import { toast } from 'sonner';
import { submissionMessages } from '@/constants/messages/submission';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onlineManager.setOnline(true);
      toast.success(submissionMessages.offline.restoredMessage);
    };

    const handleOffline = () => {
      setIsOnline(false);
      onlineManager.setOnline(false);
      toast.error(submissionMessages.offline.bannerMessage, { duration: 6000 });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
