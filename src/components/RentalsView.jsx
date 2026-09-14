import React, { useState, useMemo } from 'react';
import { Search, MapPin, Bed, Bath, Maximize2, Shield, Calendar, Phone } from 'lucide-react';
import { formatINR } from '../services/api';

const LOCALITIES = [
  'All Localities',
  'whitefield',
  'koramangala',
  'indiranagar',
  'hsr layout',
  'bellandur',
  'electronic city',
  'jp nagar',
  'hebbal',
  'sarjapur road',
  'yelahanka',
];

export default function RentalsView({ rentals }) {
  const [search, setSearch] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('All Localities');
  const [selectedBhk, setSelectedBhk] = useState('All');
  const [maxRent, setMaxRent] = useState('');
  const [displayCount, setDisplayCount] = useState(24);

  const filteredRentals = useMemo(() => {
    let list = rentals;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.apartment_name?.toLowerCase().includes(q) ||
          r.title?.toLowerCase().includes(q) ||
          r.locality?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
      );
    }

    if (selectedLocality !== 'All Localities') {
      list = list.filter((r) => r.locality?.toLowerCase() === selectedLocality.toLowerCase());
    }

    if (selectedBhk !== 'All') {
      const b = parseInt(selectedBhk, 10);
      list = list.filter((r) => r.bedroom === b);
    }

    if (maxRent) {
      const mr = parseFloat(maxRent);
      if (!isNaN(mr)) list = list.filter((r) => r.price <= mr);
    }

    return list;
  }, [rentals, search, selectedLocality, selectedBhk, maxRent]);

  const visibleRentals = filteredRentals.slice(0, displayCount);

  // Whitefield total monthly rent highlight (Question 5)
  const whitefieldSum = useMemo(() => {
    const wf = rentals.filter((r) => r.locality?.toLowerCase() === 'whitefield');
    return wf.reduce((acc, r) => acc + (r.price || 0), 0);
  }, [rentals]);

  return (
    <div id="rentals-view">
      <div className="view-header">
        <div className="view-headline">
          <div>
            <h1 className="view-title">Rental Properties</h1>
            <p className="view-subtitle">
              Browse {filteredRentals.length.toLocaleString('en-IN')} authentic rental listings in Bangalore
            </p>
          </div>

          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: 'var(--accent-emerald)',
            }}
          >
            <strong>Whitefield Total Monthly Rent:</strong> {formatINR(whitefieldSum)} / month (Q5)
          </div>
        </div>

        {/* Filter Card */}
        <div className="filter-card">
          <div className="filter-row">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                id="rentals-search-input"
                className="input-field"
                placeholder="Search rentals by society, locality, title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              id="rentals-filter-locality"
              className="select-field"
              value={selectedLocality}
              onChange={(e) => setSelectedLocality(e.target.value)}
            >
              {LOCALITIES.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === 'All Localities' ? loc : loc.charAt(0).toUpperCase() + loc.slice(1)}
                </option>
              ))}
            </select>

            <div className="pill-group">
              {['All', '1', '2', '3', '4'].map((bhk) => (
                <button
                  key={bhk}
                  id={`rentals-bhk-${bhk}`}
                  className={`pill-btn ${selectedBhk === bhk ? 'active' : ''}`}
                  onClick={() => setSelectedBhk(bhk)}
                >
                  {bhk === 'All' ? 'All BHK' : `${bhk} BHK`}
                </button>
              ))}
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Max Rent:</span>
              <input
                type="number"
                id="rentals-max-rent"
                className="input-field"
                placeholder="₹ / month"
                style={{ width: '130px', paddingLeft: '12px' }}
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="cards-grid" id="rentals-cards-grid">
        {visibleRentals.map((rental) => (
          <article
            key={rental.listing_id}
            className="property-card"
            id={`rental-card-${rental.listing_id}`}
          >
            <div className="card-header-img" style={{ height: '160px' }}>
              <img
                src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80"
                alt={rental.apartment_name}
                className="card-img-placeholder"
                loading="lazy"
              />
              <div className="badge-overlay">
                <span className="tag-badge tag-bhk">{rental.bedroom} BHK Rental</span>
                <span className="tag-badge tag-verified" style={{ textTransform: 'capitalize' }}>
                  {rental.furnishing}
                </span>
              </div>
            </div>

            <div className="card-body">
              <div className="card-price-row">
                <div className="card-price" style={{ color: 'var(--accent-emerald)' }}>
                  ₹{(rental.price || 0).toLocaleString('en-IN')}<span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>/mo</span>
                </div>
                <div className="card-rate">
                  Deposit: {formatINR(rental.deposit)}
                </div>
              </div>

              <div>
                <h3 className="card-title">
                  {rental.title || `${rental.bedroom} BHK in ${rental.apartment_name}`}
                </h3>
                <div className="card-locality" style={{ textTransform: 'capitalize' }}>
                  <MapPin size={13} color="var(--accent-emerald)" />
                  <span>{rental.locality}, Bangalore</span>
                  <span style={{ color: 'var(--text-muted)' }}>• {rental.website}</span>
                </div>
              </div>

              <div className="card-specs">
                <div className="spec-item">
                  <Bed size={14} color="var(--text-muted)" />
                  <span>{rental.bedroom} BHK</span>
                </div>
                <div className="spec-item">
                  <Bath size={14} color="var(--text-muted)" />
                  <span>{rental.bathroom} Bath</span>
                </div>
                <div className="spec-item">
                  <Maximize2 size={14} color="var(--text-muted)" />
                  <span>{rental.carpet_area} sq.ft</span>
                </div>
              </div>

              {rental.description && (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {rental.description}
                </p>
              )}

              <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Owner: {rental.posted_by_name}
                </span>
                <a
                  href={`tel:${rental.posted_by_contact}`}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}
                >
                  <Phone size={12} />
                  <span>Contact</span>
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      {visibleRentals.length < filteredRentals.length && (
        <div style={{ textAlign: 'center', marginTop: '36px' }}>
          <button
            className="btn-secondary"
            style={{ padding: '12px 28px', fontSize: '14px' }}
            onClick={() => setDisplayCount((prev) => prev + 24)}
          >
            <span>Load More Rentals ({filteredRentals.length - visibleRentals.length} remaining)</span>
          </button>
        </div>
      )}
    </div>
  );
}
