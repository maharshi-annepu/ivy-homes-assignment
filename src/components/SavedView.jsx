import React from 'react';
import { Bookmark, Trash2, Home, ExternalLink } from 'lucide-react';
import { useSaved } from '../context/SavedContext';
import { useAuth } from '../context/AuthContext';
import PropertyCard from './PropertyCard';
import { formatINR } from '../services/api';

export default function SavedView({ onSelectListing, onBrowse }) {
  const { savedListings, loading, toggleSave } = useSaved();
  const { user } = useAuth();

  const totalValue = savedListings.reduce((acc, item) => acc + (item.price || 0), 0);

  return (
    <div id="saved-view">
      <div className="view-header">
        <div className="view-headline">
          <div>
            <h1 className="view-title">Saved Properties</h1>
            <p className="view-subtitle">
              Bookmarked listings for <strong>{user?.email || 'Logged-in user'}</strong>. Persists across reloads and sessions.
            </p>
          </div>

          {savedListings.length > 0 && (
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-subtle)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}
            >
              Total Portfolio Value: <strong style={{ color: '#fff' }}>{formatINR(totalValue)}</strong> ({savedListings.length} homes)
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          Loading saved properties from server...
        </div>
      ) : savedListings.length > 0 ? (
        <div className="cards-grid" id="saved-cards-grid">
          {savedListings.map((listing) => (
            <PropertyCard
              key={listing.listing_id}
              listing={listing}
              onSelect={onSelectListing}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            maxWidth: '500px',
            margin: '40px auto',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--text-muted)',
            }}
          >
            <Bookmark size={28} />
          </div>
          <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '8px' }}>No saved properties yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
            Click the heart icon on any listing card to save homes to your personal portfolio.
          </p>
          <button id="btn-browse-from-saved" className="btn-primary" onClick={onBrowse}>
            <Home size={16} />
            <span>Browse Residential Listings</span>
          </button>
        </div>
      )}
    </div>
  );
}
