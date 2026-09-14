import React, { useEffect, useState } from 'react';
import { X, Heart, MapPin, Bed, Bath, Maximize2, Layers, Compass, Car, Phone, ShieldCheck, AlertCircle, ExternalLink, Calendar } from 'lucide-react';
import { useSaved } from '../context/SavedContext';
import { formatINR, getNormalizedCarpetArea } from '../services/api';

export default function ListingDetailModal({ listing, allListings, onClose, onSelectListing }) {
  const { isSaved, toggleSave } = useSaved();
  const [comparables, setComparables] = useState([]);

  useEffect(() => {
    if (!listing) return;

    // Push URL hash for deep linking
    window.location.hash = `listing-${listing.listing_id}`;

    // Compute comparables client-side (same locality, same bhk, price within ±15%)
    // as documented in API_REFERENCE.md (since server endpoint is 404!)
    if (allListings && allListings.length > 0) {
      const minP = listing.price * 0.85;
      const maxP = listing.price * 1.15;
      const comps = allListings
        .filter(
          (item) =>
            item.listing_id !== listing.listing_id &&
            item.locality?.toLowerCase() === listing.locality?.toLowerCase() &&
            item.bedroom === listing.bedroom &&
            item.price >= minP &&
            item.price <= maxP
        )
        .slice(0, 6);
      setComparables(comps);
    }

    return () => {
      window.location.hash = '';
    };
  }, [listing, allListings]);

  if (!listing) return null;

  const saved = isSaved(listing.listing_id);
  const { area: carpetSqft, isNormalized, rawSqm } = getNormalizedCarpetArea(listing);
  const pricePerSqft = carpetSqft > 0 ? Math.round(listing.price / carpetSqft) : 0;

  const isFloorCorrupt = listing.floor !== null && listing.total_floors !== null && listing.floor > listing.total_floors;
  const isCarpetCorrupt = listing.carpet_area && listing.super_built_up_area && listing.carpet_area > listing.super_built_up_area;

  return (
    <div className="modal-backdrop" onClick={onClose} id="listing-detail-modal">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} id="btn-close-modal">
          <X size={18} />
        </button>

        <div style={{ position: 'relative', height: '280px', background: '#0f172a' }}>
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80"
            alt={listing.apartment_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', bottom: '16px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                <span className="tag-badge tag-bhk">{listing.bedroom} BHK {listing.property_type}</span>
                {listing.is_verified && <span className="tag-badge tag-verified">Verified</span>}
                {listing.is_live === false && <span className="tag-badge tag-inactive">Inactive / Expired</span>}
              </div>
              <h2 style={{ fontSize: '26px', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                {listing.apartment_name || 'Independent Property'}
              </h2>
              <div style={{ color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', textTransform: 'capitalize' }}>
                <MapPin size={14} color="var(--accent-emerald)" />
                <span>{listing.locality}, Bangalore</span>
                <span>• Portal ID: {listing.listing_id}</span>
              </div>
            </div>

            <button
              className={`btn-save-heart ${saved ? 'saved' : ''}`}
              style={{ position: 'static', width: '44px', height: '44px' }}
              onClick={() => toggleSave(listing)}
            >
              <Heart size={20} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Price & Summary Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Asking Price
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-heading)' }}>
                {formatINR(listing.price)}
              </div>
              {pricePerSqft > 0 && (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  ₹{pricePerSqft.toLocaleString('en-IN')} per sq.ft
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {listing.listing_url && (
                <a
                  href={listing.listing_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ textDecoration: 'none' }}
                >
                  <ExternalLink size={15} />
                  <span>Original Source ({listing.website})</span>
                </a>
              )}
              <a
                href={`tel:${listing.posted_by_contact}`}
                className="btn-primary"
                style={{ textDecoration: 'none' }}
              >
                <Phone size={15} />
                <span>Call {listing.posted_by_name || 'Seller'}</span>
              </a>
            </div>
          </div>

          {/* Data Quality & Integrity Alerts */}
          {(isFloorCorrupt || isCarpetCorrupt || isNormalized) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isFloorCorrupt && (
                <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '12px 16px', borderRadius: 'var(--radius-md)', color: '#fda4af', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                  <AlertCircle size={18} />
                  <span><strong>Audit Finding:</strong> Impossible floor specified: Floor {listing.floor} in a {listing.total_floors}-storey building.</span>
                </div>
              )}
              {isCarpetCorrupt && (
                <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '12px 16px', borderRadius: 'var(--radius-md)', color: '#fda4af', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                  <AlertCircle size={18} />
                  <span><strong>Audit Finding:</strong> Carpet area ({listing.carpet_area} sq.ft) exceeds super built-up area ({listing.super_built_up_area} sq.ft), which violates physical boundaries.</span>
                </div>
              )}
              {isNormalized && (
                <div style={{ background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '12px 16px', borderRadius: 'var(--radius-md)', color: '#67e8f9', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                  <ShieldCheck size={18} />
                  <span><strong>Unit Normalization:</strong> This MagicHomes listing reported {rawSqm} square meters. We normalized it to {carpetSqft} sq.ft for fair comparison.</span>
                </div>
              )}
            </div>
          )}

          {/* Specifications Grid */}
          <div>
            <h4 style={{ fontSize: '16px', color: '#fff', marginBottom: '14px' }}>Property Specifications</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bedrooms</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{listing.bedroom} BHK</div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bathrooms</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{listing.bathroom} Baths</div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Carpet Area</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{carpetSqft} sq.ft {isNormalized && `(${rawSqm} m²)`}</div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Super Built-up</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{listing.super_built_up_area || 'N/A'} sq.ft</div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Floor Level</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>
                  {listing.floor !== null ? `Floor ${listing.floor} of ${listing.total_floors}` : 'N/A'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Furnishing</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>
                  {listing.furnishing || 'Unspecified'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Facing Direction</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>
                  {listing.facing_direction || 'N/A'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Covered Parking</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>
                  {listing.covered_parking ? `${listing.covered_parking} Vehicle(s)` : 'None'}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 style={{ fontSize: '16px', color: '#fff', marginBottom: '10px' }}>Description</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              {listing.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Seller / Agent Contact Card */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', padding: '18px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Posted by {listing.posted_by || 'Agent'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                {listing.posted_by_name || 'Verified Broker'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Phone: {listing.posted_by_contact || 'N/A'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <Calendar size={14} />
              <span>Posted: {listing.posted_at ? new Date(listing.posted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}</span>
            </div>
          </div>

          {/* Comparables / Similar Properties Strip */}
          {comparables.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <h4 style={{ fontSize: '16px', color: '#fff', marginBottom: '14px' }}>
                Comparable Properties in {listing.locality} (±15% Price)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                {comparables.map((comp) => (
                  <div
                    key={comp.listing_id}
                    onClick={() => onSelectListing(comp)}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                      {formatINR(comp.price)}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {comp.apartment_name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {comp.bedroom} BHK • {comp.carpet_area} sq.ft
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
