import React, { useState } from 'react';
import { X, Lock, Mail, Key, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth, DEMO_USERS, DEMO_PASSWORD } from '../context/AuthContext';

export default function LoginModal({ isOpen, onClose }) {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('demo1@ivy.homes');
  const [password, setPassword] = useState(DEMO_PASSWORD);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      // Error handled in context
    }
  };

  const handleSelectPreset = (presetEmail) => {
    setEmail(presetEmail);
    setPassword(DEMO_PASSWORD);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} id="login-modal-backdrop">
      <div
        className="modal-content"
        style={{ maxWidth: '440px', padding: '32px' }}
        onClick={(e) => e.stopPropagation()}
        id="login-modal-content"
      >
        <button className="modal-close-btn" onClick={onClose} id="btn-close-login">
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: '#052e16',
            }}
          >
            <Lock size={24} />
          </div>
          <h2 style={{ fontSize: '24px', color: '#fff' }}>Sign in to Ivy Homes</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Real authentication against POST /auth/login with token refresh
          </p>
        </div>

        {/* Demo Accounts Quick Select */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>
            Quick Demo Accounts (1-Click)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {DEMO_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                id={`preset-btn-${u.label.toLowerCase().replace(' ', '')}`}
                onClick={() => handleSelectPreset(u.email)}
                style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  background: email === u.email ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-input)',
                  border: email === u.email ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                  color: email === u.email ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#fda4af',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                id="login-email"
                required
                className="input-field"
                style={{ paddingLeft: '38px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                id="login-password"
                required
                className="input-field"
                style={{ paddingLeft: '38px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-submit-login"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
          >
            {loading ? 'Authenticating...' : 'Sign In & Start Session'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          Session survival guarantee: Background auto-refresh runs every 8 minutes.
        </div>
      </div>
    </div>
  );
}
