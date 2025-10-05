import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          backgroundColor: '#0a0a0a',
          borderRadius: '12px',
          border: '1px solid #333',
          p: 3,
          m: 2
        }}>
          <ErrorIcon sx={{ color: '#ff6b6b', fontSize: 48, mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
            Something went wrong
          </Typography>
          <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 2, textAlign: 'center' }}>
            The application encountered an error. This might be due to memory constraints on your device.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
            sx={{
              color: '#8884d8',
              borderColor: '#8884d8',
              '&:hover': {
                backgroundColor: '#8884d8',
                color: '#fff'
              }
            }}
          >
            Reload Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
