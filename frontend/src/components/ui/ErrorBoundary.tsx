import React, { Component, ErrorInfo, ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { sendClientError, sendTelemetry } from '../../lib/telemetry';
import { commonMessages } from '../../constants/messages/common';
import { queryClient } from '../../lib/queryClient';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  hasReloaded: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    hasReloaded: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const isChunkError = error.name === 'ChunkLoadError' || error.message.includes('Loading chunk');

    // Handle ChunkLoadError
    if (isChunkError && !this.state.hasReloaded) {
      sendTelemetry({
        event: 'chunk_load_error',
        metadata: {
          chunkName: error.message,
          // buildVersion: import.meta.env.VITE_BUILD_VERSION, // Assuming available
        }
      });
      
      this.setState({ hasReloaded: true });
      window.location.reload();
      return;
    }

    sendClientError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack || undefined,
    });
  }

  private handleRetry = () => {
    // Invalidate queries instead of clear()
    queryClient.invalidateQueries();
    
    this.setState({ hasError: false, error: null, hasReloaded: false });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 p-8 flex items-center justify-center min-h-[50vh]">
          <EmptyState
            type="error"
            title="App Crashed"
            description={commonMessages.error.default}
            actionLabel={commonMessages.action.retry}
            onAction={this.handleRetry}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
