import React, { useEffect, useState, useRef } from 'react';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { commonMessages } from '../../../constants/messages/common';
import './NetworkBanner.css';

export const NetworkBanner: React.FC = () => {
  const isOnline = useNetworkStatus();
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      setShowOnlineBanner(false);
    } else if (isOnline && wasOffline.current) {
      setShowOnlineBanner(true);
      const timer = setTimeout(() => {
        setShowOnlineBanner(false);
        wasOffline.current = false;
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!isOnline) {
    return (
      <div className="network-banner network-banner--offline" role="alert">
        <span className="network-banner__icon">⚠️</span>
        <span className="network-banner__text">{commonMessages.network.offline}</span>
      </div>
    );
  }

  if (showOnlineBanner) {
    return (
      <div className="network-banner network-banner--online" role="alert">
        <span className="network-banner__icon">✅</span>
        <span className="network-banner__text">{commonMessages.network.online}</span>
      </div>
    );
  }

  return null;
};
