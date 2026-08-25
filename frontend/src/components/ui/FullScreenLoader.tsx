import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';
import { sendTelemetry } from '../../lib/telemetry';
import { commonMessages } from '../../constants/messages/common';

export const FullScreenLoader = () => {
  const [showTimeout, setShowTimeout] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
      sendTelemetry({
        event: 'loader_timeout',
        metadata: {
          url: window.location.href,
        }
      });
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleEscape = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse text-center px-4">
        {showTimeout ? commonMessages.loader.stillLoading : commonMessages.loading}
      </p>
      {showTimeout && (
        <Button variant="link" onClick={handleEscape} className="mt-4">
          {commonMessages.action.backToLogin}
        </Button>
      )}
    </div>
  );
};
