import React from 'react';
import { ChefHat, RefreshCw, AlertTriangle, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CineBite Unhandled Render Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReloadKitchen = () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('cinebite_staff_auth');
        window.location.href = '/kitchen';
      }
    } catch (e) {
      window.location.reload();
    }
  };

  handleReloadCustomer = () => {
    try {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (e) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const isKitchenPath = typeof window !== 'undefined' && 
        (window.location.pathname.includes('/kitchen') || window.location.search.includes('portal=staff'));

      return (
        <div style={{
          minHeight: '100vh',
          background: '#07080B',
          color: '#F9FAFB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: '#0E1015',
            border: '1px solid rgba(229, 9, 20, 0.4)',
            borderRadius: '18px',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 25px rgba(229, 9, 20, 0.25)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(229, 9, 20, 0.15)',
              border: '1px solid rgba(229, 9, 20, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              {isKitchenPath ? (
                <ChefHat size={32} color="#FF9F1C" />
              ) : (
                <AlertTriangle size={32} color="#E50914" />
              )}
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem', color: '#FFFFFF' }}>
              CineBite Cinema In-Seat Dining
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#9CA3AF', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              The application encountered a temporary display issue. Click below to safely restore the live session.
            </p>

            {this.state.error && (
              <div style={{
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.75rem',
                color: '#FFB84D',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '1.5rem',
                fontFamily: 'monospace'
              }}>
                {String(this.state.error?.message || this.state.error)}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={this.handleReloadKitchen}
                style={{
                  background: 'linear-gradient(135deg, #FF9F1C, #FFB703)',
                  color: '#07080B',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  padding: '12px 20px',
                  borderRadius: '100px',
                  cursor: 'pointer',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <ChefHat size={18} />
                <span>Open Live Kitchen Dashboard</span>
              </button>

              <button
                type="button"
                onClick={this.handleReloadCustomer}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  padding: '11px 20px',
                  borderRadius: '100px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Home size={16} />
                <span>Return to Customer Food Menu</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
