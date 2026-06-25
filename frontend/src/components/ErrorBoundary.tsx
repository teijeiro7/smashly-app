import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  private handleGoToError = () => {
    window.location.href = `/error?type=500&message=${encodeURIComponent(
      this.state.error?.message || 'Error desconocido'
    )}`;
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, var(--primary-subtle) 0%, var(--primary-faint) 100%)',
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: '16px',
              padding: '3rem 2rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 10px 40px rgba(var(--primary-rgb), 0.12)',
            }}
          >
            <h1 style={{ fontSize: '3rem', margin: '0', color: 'var(--danger)', fontWeight: '700' }}>
              ¡Ups!
            </h1>
            <h2 style={{ fontSize: '1.5rem', margin: '1rem 0', color: 'var(--text)' }}>
              Algo salió mal
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: '1.5rem 0', lineHeight: '1.6' }}>
              Ha ocurrido un error inesperado. Puedes intentar recargar la página o volver al inicio.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'var(--brand-on-surface)',
                }}
              >
                Reintentar
              </button>
              <button
                onClick={this.handleGoToError}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                }}
              >
                Ver Detalles
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
