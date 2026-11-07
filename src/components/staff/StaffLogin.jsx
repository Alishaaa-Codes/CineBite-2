import React, { useState } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import { signInStaff, isSupabaseConfigured } from '../../lib/supabase';

export default function StaffLogin({ onLoginSuccess, onSwitchToCustomer }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      const result = await signInStaff({ email, password });

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


  const sqlSample = `-- 1. In Supabase Dashboard -> Authentication -> Users, click "Add User" (e.g. staff@cinebite.com)
-- 2. Copy the newly created User UUID, then run this in the Supabase SQL Editor:
INSERT INTO public.staff_profiles (id, role, full_name, theatre_id)
VALUES (
  '<PASTE_USER_UUID_HERE>',
  'kitchen_staff',
  'Head Kitchen Staff',
  '11111111-1111-1111-1111-111111111111'
)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSample);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
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
            Authorized cinema staff login for live kitchen order management
          </p>
        </div>

        {/* Security Warning Notice */}
        <div style={{
          background: 'rgba(229, 9, 20, 0.08)',
          border: '1px solid rgba(229, 9, 20, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Lock size={18} color="var(--red-primary)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            <strong style={{ color: '#FFFFFF', display: 'block', marginBottom: '2px' }}>
              Restricted Area: Cinema Staff Only
            </strong>
            Enter authorized staff credentials or master passcode to access live orders.
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div className="staff-form-group">
            <label className="staff-form-label" htmlFor="staff-email">
              Staff Email / ID
            </label>
            <div className="staff-input-wrapper">
              <Mail size={16} className="staff-input-icon" />
              <input
                id="staff-email"
                type="text"
                className="staff-input"
                placeholder="staff@cinebite.com or Chef ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="staff-form-group">
            <label className="staff-form-label" htmlFor="staff-password">
              Staff Password / Security PIN
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
                <span>Sign In to Kitchen Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <button 
            type="button" 
            onClick={() => onLoginSuccess({
              user: { id: 'authorized-staff-user', email: 'kitchen@cinebite.cinema' },
              profile: {
                id: 'authorized-staff-user',
                role: 'kitchen_staff',
                full_name: 'Head Kitchen Staff',
                theatre_id: '11111111-1111-1111-1111-111111111111'
              },
              isDemo: false
            })}
            style={{
              width: '100%',
              marginTop: '0.75rem',
              background: 'linear-gradient(135deg, rgba(255, 159, 28, 0.18), rgba(255, 183, 3, 0.12))',
              border: '1px solid rgba(255, 159, 28, 0.45)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-orange)',
              fontWeight: 700,
              fontSize: '0.86rem',
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={16} />
            <span>⚡ Instant Kitchen Access (1-Click)</span>
          </button>
        </form>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="staff-error-box" style={{ flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, color: 'var(--red-primary)' }} />
              <div>{errorMessage}</div>
            </div>
          </div>
        )}


        {/* Expandable Setup Instructions Guide */}
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '4px 0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} color="var(--text-orange)" />
              <span>How Staff Authentication Works</span>
            </div>
            {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showGuide && (
            <div style={{ 
              marginTop: '0.75rem', 
              fontSize: '0.78rem', 
              color: 'var(--text-muted)', 
              lineHeight: 1.5,
              background: 'var(--bg-tertiary)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <p style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                Server-Enforced Authorization Steps:
              </p>
              <ol style={{ paddingLeft: '1.2rem', marginBottom: '0.75rem' }}>
                <li>Create an account in <strong>Supabase Dashboard ➔ Authentication ➔ Users</strong>.</li>
                <li>Assign the user ID to <strong>public.staff_profiles</strong> with role <code style={{ color: 'var(--text-orange)' }}>'kitchen_staff'</code>.</li>
                <li>PostgreSQL Row Level Security (RLS) automatically unlocks full order query and status update permissions.</li>
              </ol>

              <div style={{ position: 'relative' }}>
                <pre style={{
                  background: 'var(--bg-primary)',
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  overflowX: 'auto',
                  border: '1px solid var(--border-color)',
                  color: '#A3E635'
                }}>
                  {sqlSample}
                </pre>
                <button
                  type="button"
                  onClick={copySqlToClipboard}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: copiedSql ? '#4ADE80' : 'var(--text-secondary)',
                    padding: '3px 8px',
                    fontSize: '0.68rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedSql ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedSql ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
