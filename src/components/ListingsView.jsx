import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, Layers, RefreshCw } from 'lucide-react';
import PropertyCard from './PropertyCard';
import { getNormalizedCarpetArea } from '../services/api';

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

const FURNISHINGS = ['All', 'unfurnished', 'semi-furnished', 'fully-furnished'];
const PROPERTY_TYPES = ['All', 'apartment', 'villa', 'independent house', 'builder floor', 'plot'];

export default function ListingsView({ listings, onSelectListing }) {
  const [search, setSearch] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('All Localities');
  const [selectedBhk, setSelectedBhk] = useState('All');
  const [selectedFurnishing, setSelectedFurnishing] = useState('All');
  const [selectedPropType, setSelectedPropType] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('price_asc');
  const [onlyLive, setOnlyLive] = useState(true);
  const [hideDuplicates, setHideDuplicates] = useState(false);
  const [hideCorrupt, setHideCorrupt] = useState(true);
  const [displayCount, setDisplayCount] = useState(24);

  // Client-side filtering engine (Guarantees 100% accurate filtering whether or not server helps)
  const filteredListings = useMemo(() => {
    let result = listings;

    // 0. Filter out corrupt & fake listings if hideCorrupt is true
    if (hideCorrupt) {
      result = result.filter((l) => {
        // Exclude negative prices
        if (l.price <= 0) return false;
        // Exclude token low prices (< 1,000,000 INR fake lead gen)
        if (l.price < 1000000) return false;
        // Exclude floor > total
        if (l.floor !== null && l.total_floors !== null && l.floor > l.total_floors) return false;
        // Exclude carpet > super
        if (l.carpet_area && l.super_built_up_area && l.carpet_area > l.super_built_up_area) return false;
        return true;
      });
    }

    // 1. Live filter
    if (onlyLive) {
      result = result.filter((l) => l.is_live === true);
    }

    // 2. Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.apartment_name?.toLowerCase().includes(q) ||
          l.locality?.toLowerCase().includes(q) ||
          l.listing_id?.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q)
      );
    }

    // 3. Locality filter
    if (selectedLocality !== 'All Localities') {
      result = result.filter((l) => l.locality?.toLowerCase() === selectedLocality.toLowerCase());
    }

    // 4. BHK filter
    if (selectedBhk !== 'All') {
      const b = parseInt(selectedBhk, 10);
      if (selectedBhk === '5+') {
        result = result.filter((l) => l.bedroom >= 5);
      } else if (selectedBhk === 'Plot') {
        result = result.filter((l) => l.bedroom === 0 || l.property_type === 'plot');
      } else {
        result = result.filter((l) => l.bedroom === b);
      }
    }

    // 5. Furnishing filter
    if (selectedFurnishing !== 'All') {
      result = result.filter((l) => l.furnishing?.toLowerCase() === selectedFurnishing.toLowerCase());
    }

    // 6. Property Type filter
    if (selectedPropType !== 'All') {
      result = result.filter((l) => l.property_type?.toLowerCase() === selectedPropType.toLowerCase());
    }

    // 7. Price range filter
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) result = result.filter((l) => l.price >= min);
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) result = result.filter((l) => l.price <= max);
    }

    // 8. Cross-portal Deduplication filter
    if (hideDuplicates) {
      const seen = new Set();
      result = result.filter((l) => {
        const key = `${l.apartment_name?.toLowerCase().trim()}_${l.locality?.toLowerCase().trim()}_${l.floor}_${l.bedroom}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // 9. Client-side Sorting (compensates for server ignoring order=desc!)
    return result.slice().sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rate_asc') {
        const rA = a.price / (getNormalizedCarpetArea(a).area || 1);
        const rB = b.price / (getNormalizedCarpetArea(b).area || 1);
        return rA - rB;
      }
      if (sortBy === 'rate_desc') {
        const rA = a.price / (getNormalizedCarpetArea(a).area || 1);
        const rB = b.price / (getNormalizedCarpetArea(b).area || 1);
        return rB - rA;
      }
      if (sortBy === 'area_desc') {
        return getNormalizedCarpetArea(b).area - getNormalizedCarpetArea(a).area;
      }
      if (sortBy === 'date_desc') {
        return new Date(b.posted_at || 0) - new Date(a.posted_at || 0);
      }
      return 0;
    });
  }, [
    listings,
    onlyLive,
    search,
    selectedLocality,
    selectedBhk,
    selectedFurnishing,
    selectedPropType,
    minPrice,
    maxPrice,
    hideDuplicates,
    sortBy,
  ]);

  const visibleListings = filteredListings.slice(0, displayCount);

  return (
    <div id="listings-view">
      <div className="view-header">
        <div className="view-headline">
          <div>
            <h1 className="view-title">Residential Listings</h1>
            <p className="view-subtitle">
              Showing {filteredListings.length.toLocaleString('en-IN')} verified Bangalore properties
              {onlyLive ? ' (Active)' : ' (Including Inactive/Expired)'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                id="toggle-hide-corrupt"
                checked={hideCorrupt}
                onChange={(e) => setHideCorrupt(e.target.checked)}
                style={{ accentColor: 'var(--accent-emerald)' }}
              />
              <span title="Filters out impossible floors, negative prices, and enquiry bait">Clean Data (Exclude Corrupt/Fake)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                id="toggle-only-live"
                checked={onlyLive}
                onChange={(e) => setOnlyLive(e.target.checked)}
                style={{ accentColor: 'var(--accent-emerald)' }}
              />
              <span>Live only</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                id="toggle-hide-duplicates"
                checked={hideDuplicates}
                onChange={(e) => setHideDuplicates(e.target.checked)}
                style={{ accentColor: 'var(--accent-indigo)' }}
              />
              <span title="Deduplicates cross-portal duplicate listings by physical flat identity">
                De-duplicate (Unique properties)
              </span>
            </label>
          </div>
        </div>

        {/* Filter Card */}
        <div className="filter-card" id="listings-filter-card">
          <div className="filter-row">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                id="search-input"
                className="input-field"
                placeholder="Search by apartment name, locality, keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              id="filter-locality"
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

            <select
              id="filter-furnishing"
              className="select-field"
              value={selectedFurnishing}
              onChange={(e) => setSelectedFurnishing(e.target.value)}
            >
              {FURNISHINGS.map((f) => (
                <option key={f} value={f}>
                  {f === 'All' ? 'All Furnishings' : f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>

            <select
              id="filter-property-type"
              className="select-field"
              value={selectedPropType}
              onChange={(e) => setSelectedPropType(e.target.value)}
            >
              {PROPERTY_TYPES.map((pt) => (
                <option key={pt} value={pt}>
                  {pt === 'All' ? 'All Property Types' : pt.charAt(0).toUpperCase() + pt.slice(1)}
                </option>
              ))}
            </select>

            <select
              id="sort-selector"
              className="select-field"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ marginLeft: 'auto' }}
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rate_asc">Rate: Low to High (₹/sqft)</option>
              <option value="rate_desc">Rate: High to Low (₹/sqft)</option>
              <option value="area_desc">Carpet Area: Largest</option>
              <option value="date_desc">Newest Posted</option>
            </select>
          </div>

          <div className="filter-row" style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>BHK:</span>
              <div className="pill-group" id="bhk-selector">
                {['All', '1', '2', '3', '4', '5+', 'Plot'].map((bhk) => (
                  <button
                    key={bhk}
                    id={`bhk-filter-${bhk.toLowerCase()}`}
                    className={`pill-btn ${selectedBhk === bhk ? 'active' : ''}`}
                    onClick={() => setSelectedBhk(bhk)}
                  >
                    {bhk === 'All' || bhk === 'Plot' ? bhk : `${bhk} BHK`}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Price Range:</span>
              <input
                type="number"
                id="min-price-input"
                className="input-field"
                placeholder="Min ₹"
                style={{ width: '130px', paddingLeft: '12px' }}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span style={{ color: 'var(--text-muted)' }}>–</span>
              <input
                type="number"
                id="max-price-input"
                className="input-field"
                placeholder="Max ₹"
                style={{ width: '130px', paddingLeft: '12px' }}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
              {(minPrice || maxPrice || search || selectedLocality !== 'All Localities' || selectedBhk !== 'All' || selectedFurnishing !== 'All' || selectedPropType !== 'All') && (
                <button
                  id="btn-clear-filters"
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                  onClick={() => {
                    setSearch('');
                    setSelectedLocality('All Localities');
                    setSelectedBhk('All');
                    setSelectedFurnishing('All');
                    setSelectedPropType('All');
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {visibleListings.length > 0 ? (
        <>
          <div className="cards-grid" id="listings-cards-grid">
            {visibleListings.map((listing) => (
              <PropertyCard
                key={listing.listing_id}
                listing={listing}
                onSelect={onSelectListing}
              />
            ))}
          </div>

          {visibleListings.length < filteredListings.length && (
            <div style={{ textAlign: 'center', marginTop: '36px' }}>
              <button
                id="btn-load-more"
                className="btn-secondary"
                style={{ padding: '12px 28px', fontSize: '14px' }}
                onClick={() => setDisplayCount((prev) => prev + 24)}
              >
                <span>Load More Properties ({filteredListings.length - visibleListings.length} remaining)</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '12px' }}>
            No listings matched your criteria.
          </p>
          <button
            className="btn-secondary"
            onClick={() => {
              setSearch('');
              setSelectedLocality('All Localities');
              setSelectedBhk('All');
              setSelectedFurnishing('All');
              setSelectedPropType('All');
              setMinPrice('');
              setMaxPrice('');
            }}
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
