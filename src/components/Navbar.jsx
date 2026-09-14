import React, { useState } from 'react';
import { Building2, Home, KeyRound, Bookmark, BarChart3, User, LogOut, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSaved } from '../context/SavedContext';

export default function Navbar({ activeTab, setActiveTab, onOpenAuth }) {
  const { user, isAuthenticated, logout, switchAccount, demoUsers } = useAuth();
  const { savedCount } = useSaved();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="navbar">
      <div className="nav-brand" onClick={() => setActiveTab('listings')} id="brand-logo">
        <div className="brand-icon">
          <Building2 size={22} />
        </div>
        <div>
          <div className="brand-title">
            Ivy Homes <span className="brand-badge">Bangalore</span>
          </div>
        </div>
      </div>

      <nav className="nav-links" id="main-navigation">
        <button
          id="nav-tab-listings"
          className={`nav-item ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('listings')}
        >
          <Home size={16} />
          <span>Listings</span>
        </button>

        <button
          id="nav-tab-rentals"
          className={`nav-item ${activeTab === 'rentals' ? 'active' : ''}`}
          onClick={() => setActiveTab('rentals')}
        >
          <KeyRound size={16} />
          <span>Rentals</span>
        </button>

        <button
          id="nav-tab-projects"
          className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <Building2 size={16} />
          <span>Projects</span>
        </button>

        <button
          id="nav-tab-saved"
          className={`nav-item ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          <Bookmark size={16} />
          <span>Saved</span>
          {savedCount > 0 && <span className="badge-count" id="saved-count-badge">{savedCount}</span>}
        </button>

        <button
          id="nav-tab-insights"
          className={`nav-item ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          <BarChart3 size={16} />
          <span>Insights & Audit</span>
        </button>
      </nav>

      <div className="nav-user-actions">
        {isAuthenticated ? (
          <div style={{ position: 'relative' }}>
            <div
              className="user-pill"
              id="user-profile-menu-btn"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              <div className="user-avatar">
                {user?.email?.charAt(4) || 'U'}
              </div>
              <span className="user-name">{user?.email?.split('@')[0]}</span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </div>

            {showUserDropdown && (
              <div
                id="user-dropdown-menu"
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: '240px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '8px',
                  zIndex: 150,
                }}
              >
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Active Session
                  </div>
                  <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600, wordBreak: 'break-all' }}>
                    {user?.email}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', marginTop: '2px' }}>
                    ● Auto-refresh active (30+ min survival)
                  </div>
                </div>

                <div style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Switch Demo Account
                </div>
                {demoUsers.map((u) => (
                  <button
                    key={u.email}
                    id={`switch-to-${u.label.toLowerCase().replace(' ', '')}`}
                    onClick={() => {
                      switchAccount(u.email);
                      setShowUserDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: user?.email === u.email ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                      border: 'none',
                      color: user?.email === u.email ? 'var(--accent-emerald)' : 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{u.label} ({u.email.split('@')[0]})</span>
                    {user?.email === u.email && <Check size={14} />}
                  </button>
                ))}

                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '6px', paddingTop: '6px' }}>
                  <button
                    id="btn-logout"
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--accent-rose)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button id="btn-open-login" className="btn-primary" onClick={onOpenAuth}>
            <User size={16} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
