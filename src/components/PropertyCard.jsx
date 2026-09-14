import React from 'react';
import { Heart, MapPin, Bed, Bath, Maximize2, Layers, CheckCircle, AlertTriangle } from 'lucide-react';
import { useSaved } from '../context/SavedContext';
import { formatINR, getNormalizedCarpetArea } from '../services/api';

export default function PropertyCard({ listing, onSelect }) {
  const { isSaved, toggleSave } = useSaved();
  const saved = isSaved(listing.listing_id);

  const { area: carpetSqft, isNormalized, rawSqm } = getNormalizedCarpetArea(listing);
  const pricePerSqft = carpetSqft > 0 ? Math.round(listing.price / carpetSqft) : 0;

  // Placeholder building image generator based on ID
  const imgNum = Math.abs(listing.listing_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 12) + 1;
  const imageUrl = `https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=60`;

  return (
    <article
      className="property-card"
      id={`property-card-${listing.listing_id}`}
      onClick={() => onSelect(listing)}
    >
      <div className="card-header-img">
        <img
          src={`https://images.unsplash.com/photo-${[
            '1545324418-cc1a3fa10c00',
            '1512917774080-9991f1c4c750',
            '1600596542815-ffad4c1539a9',
            '1600585154340-be6161a56a0c',
            '1600607687939-ce8a6c25118c',
            '1580587771525-78b9dba3b914',
            '1513694203232-719a280e022f',
          ][imgNum % 7]}?w=600&auto=format&fit=crop&q=80`}
          alt={listing.apartment_name}
          className="card-img-placeholder"
          loading="lazy"
        />

        <div className="badge-overlay">
          {listing.price < 0 && (
            <span className="tag-badge" style={{ background: '#f43f5e', color: '#fff' }}>
              Corrupt Price (Q4)
            </span>
          )}
          {listing.floor !== null && listing.total_floors !== null && listing.floor > listing.total_floors && (
            <span className="tag-badge" style={{ background: '#f43f5e', color: '#fff' }}>
              Corrupt Floor (Q4)
            </span>
          )}
          {listing.carpet_area && listing.super_built_up_area && listing.carpet_area > listing.super_built_up_area && (
            <span className="tag-badge" style={{ background: '#f43f5e', color: '#fff' }}>
              Corrupt Area (Q4)
            </span>
          )}
          {listing.price > 0 && listing.price < 1000000 && (
            <span className="tag-badge" style={{ background: '#f59e0b', color: '#000', fontWeight: 800 }}>
              Fake Enquiry Gen (Q9)
            </span>
          )}
          {listing.is_verified && (
            <span className="tag-badge tag-verified">
              <CheckCircle size={10} style={{ display: 'inline', marginRight: '3px' }} /> Verified
            </span>
          )}
          {listing.is_live === false && (
            <span className="tag-badge tag-inactive">Inactive</span>
          )}
          {isNormalized && (
            <span className="tag-badge tag-normalized" title={`Reported ${rawSqm} m² in MagicHomes; converted to ${carpetSqft} sq.ft`}>
              Unit Fixed ({rawSqm}m²)
            </span>
          )}
          <span className="tag-badge tag-bhk">
            {listing.bedroom ? `${listing.bedroom} BHK` : 'Plot'}
          </span>
        </div>

        <button
          className={`btn-save-heart ${saved ? 'saved' : ''}`}
          id={`btn-save-${listing.listing_id}`}
          title={saved ? 'Remove from saved' : 'Save property'}
          onClick={(e) => {
            e.stopPropagation();
            toggleSave(listing);
          }}
        >
          <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="card-body">
        <div className="card-price-row">
          <div className="card-price" id={`card-price-${listing.listing_id}`}>
            {formatINR(listing.price)}
          </div>
          {pricePerSqft > 0 && (
            <div className="card-rate" title="Calculated as Price / Carpet Area">
              ₹{pricePerSqft.toLocaleString('en-IN')}/sq.ft
            </div>
          )}
        </div>

        <div>
          <h3 className="card-title" title={listing.apartment_name}>
            {listing.apartment_name || 'Independent Property'}
          </h3>
          <div className="card-locality" style={{ textTransform: 'capitalize', marginTop: '3px' }}>
            <MapPin size={13} color="var(--accent-emerald)" />
            <span>{listing.locality || 'Bangalore'}</span>
            <span style={{ color: 'var(--text-muted)' }}>• {listing.website}</span>
          </div>
        </div>

        <div className="card-specs">
          {listing.bedroom !== null && (
            <div className="spec-item" title="Bedrooms">
              <Bed size={14} color="var(--text-muted)" />
              <span>{listing.bedroom} BHK</span>
            </div>
          )}
          {listing.bathroom !== null && (
            <div className="spec-item" title="Bathrooms">
              <Bath size={14} color="var(--text-muted)" />
              <span>{listing.bathroom} Bath</span>
            </div>
          )}
          <div className="spec-item" title="Carpet Area">
            <Maximize2 size={14} color="var(--text-muted)" />
            <span>{carpetSqft} sq.ft</span>
          </div>
          {listing.floor !== null && listing.total_floors !== null && (
            <div className="spec-item" title="Floor">
              <Layers size={14} color="var(--text-muted)" />
              <span>Fl {listing.floor}/{listing.total_floors}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
