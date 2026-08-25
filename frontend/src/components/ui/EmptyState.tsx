import { FolderX, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';
import { commonMessages } from '../../constants/messages/common';
import { cn } from '../../lib/utils';

type EmptyStateType = 'no_data' | 'no_permission' | 'error';

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  showBack?: boolean;
  compact?: boolean;
  userRole?: 'STUDENT' | 'TEACHER' | 'ADMIN' | null;
}

export const EmptyState = ({
  type,
  title,
  description,
  actionLabel,
  onAction,
  showBack,
  compact = false,
  userRole = 'STUDENT',
}: EmptyStateProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(userRole === 'STUDENT' ? '/dashboard' : '/teacher');
    }
  };

  const config = {
    no_data: {
      icon: <FolderX className="h-12 w-12 text-muted-foreground mb-4" />,
      defaultTitle: commonMessages.empty.noData,
      defaultDesc: '',
    },
    no_permission: {
      icon: <ShieldAlert className="h-12 w-12 text-amber-500 mb-4" />,
      defaultTitle: commonMessages.empty.noPermission,
      defaultDesc: commonMessages.error.forbidden,
    },
    error: {
      icon: <AlertTriangle className="h-12 w-12 text-destructive mb-4" />,
      defaultTitle: commonMessages.error.default,
      defaultDesc: '',
    },
  };

  const { icon, defaultTitle, defaultDesc } = config[type];

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center bg-card border border-border rounded-lg shadow-sm w-full",
        !compact && "min-h-[300px]"
      )}
    >
      {icon}
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title || defaultTitle}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {description || defaultDesc}
      </p>
      
      <div className="flex gap-4">
        {showBack && (
          <Button variant="outline" onClick={handleBack}>
            {commonMessages.action.back}
          </Button>
        )}
        {actionLabel && onAction && (
          <Button variant={type === 'no_permission' ? 'secondary' : 'default'} onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

// Strict Wrappers to enforce UX rules
export const NoDataState = (props: Omit<EmptyStateProps, 'type' | 'showBack'> & { onAction: () => void, actionLabel: string }) => <EmptyState type="no_data" {...props} />;
export const ErrorState = (props: Omit<EmptyStateProps, 'type'> & { onAction: () => void, actionLabel: string }) => <EmptyState type="error" {...props} />;
export const NoPermissionState = (props: Omit<EmptyStateProps, 'type' | 'onAction' | 'actionLabel'>) => <EmptyState type="no_permission" showBack {...props} />;
