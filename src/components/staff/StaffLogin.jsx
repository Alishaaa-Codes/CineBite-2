import React, { useState, useMemo } from 'react';
import { 
  ChefHat, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Sparkles,
  ArrowLeft,
  Building2,
  Plus,
  KeyRound,
  MapPin
} from 'lucide-react';
import { signInStaff } from '../../lib/supabase';
import { getAllCinemas, resolveCinema, registerCinema } from '../../data/cinemaRegistry';

export default function StaffLogin({ onLoginSuccess, onSwitchToCustomer }) {
  const [cinemas, setCinemas] = useState(getAllCinemas);
  const [selectedCinemaSlug, setSelectedCinemaSlug] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = sessionStorage.getItem('cinebite_staff_auth') || localStorage.getItem('cinebite_staff_auth');
      if (savedAuth) {
        try {
          const parsed = JSON.parse(savedAuth);
          if (parsed?.profile?.theatre_slug) return parsed.profile.theatre_slug;
        } catch (e) {}
      }
      const params = new URLSearchParams(window.location.search);
      const urlCinema = params.get('cinema') || params.get('theatre') || params.get('theater');
      if (urlCinema) {
        return resolveCinema(urlCinema)?.slug || 'pvr-grand';
      }
    }
    return 'pvr-grand';
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [isAddingCinema, setIsAddingCinema] = useState(false);
  const [newCinemaName, setNewCinemaName] = useState('');
  const [newCinemaCity, setNewCinemaCity] = useState('');
  const [newCinemaPin, setNewCinemaPin] = useState('1234');

  const selectedCinema = useMemo(() => {
    return resolveCinema(selectedCinemaSlug);
  }, [selectedCinemaSlug, cinemas]);

  // Handle registering a new custom cinema
  const handleCreateCinema = (e) => {
    e.preventDefault();
    if (!newCinemaName.trim()) {
      setErrorMessage('Please enter a cinema name.');
      return;
    }

    try {
      const created = registerCinema({
        name: newCinemaName.trim(),
        city: newCinemaCity.trim() || 'India',
        passcode: newCinemaPin.trim() || '1234'
      });
      const updatedList = getAllCinemas();
      setCinemas(updatedList);
      setSelectedCinemaSlug(created.slug);
      setPassword(created.passcodes[0]);
      setIsAddingCinema(false);
      setNewCinemaName('');
      setNewCinemaCity('');
      setErrorMessage('');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to register cinema.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password) {
      setErrorMessage('Please enter the cinema security password or staff PIN.');
      return;
    }

    try {
      setIsLoading(true);
      const result = await signInStaff({
        email: email || `kitchen@${selectedCinema.slug}.cinema`,
        password,
        cinemaSlug: selectedCinema.slug,
        theatreId: selectedCinema.id
      });

      if (result.success && result.isStaffAuthorized) {
        onLoginSuccess({
          user: result.user,
          profile: result.staffProfile,
          isDemo: Boolean(result.isDemo)
        });
      } else if (!result.isStaffAuthorized) {
        setErrorMessage(result.error || 'Access Denied: Account lacks staff role authorization.');
        setShowGuide(true);
      }
    } catch (err) {
      console.error('Staff login error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick PIN Auto-fill helper
  const handleQuickPinFill = (pin) => {
    setPassword(pin);
    setErrorMessage('');
  };

  return (
    <div className="staff-login-page">
      <div className="staff-login-card">
        {/* Top Back Link */}
        <button 
          onClick={onSwitchToCustomer}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            marginBottom: '1rem',
            padding: 0
          }}
        >
          <ArrowLeft size={14} /> Back to Customer Menu
        </button>

        {/* Header */}
        <div className="staff-login-header">
          <div className="staff-login-icon-box">
            <ChefHat size={30} />
          </div>
          <h1 className="staff-login-title">Food Department Portal</h1>
          <p className="staff-login-subtitle">
            Multi-Cinema live order fulfillment & kitchen dashboard
          </p>
        </div>

        {/* Security Warning Notice */}
        <div style={{
          background: 'rgba(229, 9, 20, 0.08)',
          border: '1px solid rgba(229, 9, 20, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Lock size={18} color="var(--red-primary)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            <strong style={{ color: '#FFFFFF', display: 'block', marginBottom: '2px' }}>
              Cinema-Specific In-Seat Orders Feed
            </strong>
            Select which cinema kitchen to open. Each cinema has isolated orders & dedicated PIN.
          </div>
        </div>

        {/* Cinema Selector Field */}
        <div className="staff-form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="staff-form-label" style={{ marginBottom: 0 }}>
              Select Cinema / Theatre
            </label>
            <button
              type="button"
              onClick={() => setIsAddingCinema(!isAddingCinema)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-orange)',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: 0
              }}
            >
              <Plus size={12} />
              <span>{isAddingCinema ? 'Cancel' : 'Add New Cinema'}</span>
            </button>
          </div>

          {!isAddingCinema ? (
            <div className="staff-input-wrapper">
              <Building2 size={16} className="staff-input-icon" color="#FF9F1C" />
              <select
                className="staff-input"
                value={selectedCinemaSlug}
                onChange={(e) => {
                  setSelectedCinemaSlug(e.target.value);
                  setErrorMessage('');
                }}
                style={{ cursor: 'pointer', color: '#FFFFFF', fontWeight: 600 }}
              >
                {cinemas.map((c) => (
                  <option key={c.slug} value={c.slug} style={{ background: '#121520', color: '#FFFFFF' }}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            /* Register New Cinema Form */
            <div style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid rgba(255, 159, 28, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFB703' }}>
                Register New Cinema Client
              </div>
              <input
                type="text"
                placeholder="Cinema Name (e.g. Cinepolis Mall of Asia)"
                value={newCinemaName}
                onChange={(e) => setNewCinemaName(e.target.value)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: '#FFFFFF',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="City (e.g. Bengaluru)"
                  value={newCinemaCity}
                  onChange={(e) => setNewCinemaCity(e.target.value)}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: '#FFFFFF',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    fontSize: '0.8rem'
                  }}
                />
                <input
                  type="text"
                  placeholder="Set Cinema PIN (e.g. 1234)"
                  value={newCinemaPin}
                  onChange={(e) => setNewCinemaPin(e.target.value)}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: '#FFFFFF',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    fontSize: '0.8rem'
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleCreateCinema}
                style={{
                  background: 'linear-gradient(135deg, #FF9F1C, #FFB703)',
                  border: 'none',
                  color: '#0A0C14',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  padding: '8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={14} />
                <span>Save & Select Cinema</span>
              </button>
            </div>
          )}
        </div>

        {/* Selected Cinema Preview Badge */}
        {selectedCinema && !isAddingCinema && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: selectedCinema.brandColor || '#E50914'
              }} />
              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{selectedCinema.name}</span>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>{selectedCinema.city}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div className="staff-form-group">
            <label className="staff-form-label" htmlFor="staff-email">
              Staff Email / Chef ID (Optional)
            </label>
            <div className="staff-input-wrapper">
              <Mail size={16} className="staff-input-icon" />
              <input
                id="staff-email"
                type="text"
                className="staff-input"
                placeholder={`chef@${selectedCinema?.slug || 'cinebite'}.cinema`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="staff-form-group">
            <label className="staff-form-label" htmlFor="staff-password">
              Security PIN / Password
            </label>
            <div className="staff-input-wrapper">
              <Lock size={16} className="staff-input-icon" />
              <input
                id="staff-password"
                type="password"
                className="staff-input"
                placeholder="Enter password or staff PIN"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Quick PIN Pill Suggestions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            marginBottom: '1.25rem',
            fontSize: '0.72rem'
          }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <KeyRound size={12} color="#FF9F1C" /> Quick PIN:
            </span>
            {selectedCinema?.passcodes?.[0] && (
              <button
                type="button"
                onClick={() => handleQuickPinFill(selectedCinema.passcodes[0])}
                style={{
                  background: 'rgba(255, 159, 28, 0.15)',
                  border: '1px solid rgba(255, 159, 28, 0.35)',
                  color: '#FFB703',
                  borderRadius: '100px',
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {selectedCinema.passcodes[0]}
              </button>
            )}
            <button
              type="button"
              onClick={() => handleQuickPinFill('cinebite2026')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--text-secondary)',
                borderRadius: '100px',
                padding: '2px 8px',
                fontSize: '0.72rem',
                cursor: 'pointer'
              }}
            >
              cinebite2026 (Master)
            </button>
          </div>

          <button 
            type="submit" 
            className="staff-login-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Verifying Authorization...</span>
            ) : (
              <>
                <Lock size={16} />
                <span>Open {selectedCinema?.name ? `${selectedCinema.name.split(' ')[0]} Kitchen` : 'Kitchen Dashboard'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="staff-error-box" style={{ flexDirection: 'column', gap: '8px', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, color: 'var(--red-primary)' }} />
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        {/* Multi-Cinema Note */}
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <p style={{ margin: 0 }}>
            💡 <strong>Multi-Tenant Isolation:</strong> Any device (PC, tablet, mobile) logging into <strong>{selectedCinema?.name}</strong> will receive orders placed exclusively for that cinema in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
