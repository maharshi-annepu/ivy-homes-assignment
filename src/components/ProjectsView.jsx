import React, { useState, useMemo } from 'react';
import { Search, Building2, Calendar, MapPin, CheckCircle, ExternalLink, Sparkles, Layers } from 'lucide-react';
import { formatINR, formatProjectPrice } from '../services/api';

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

export default function ProjectsView({ projects, onSelectProject }) {
  const [search, setSearch] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('All Localities');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [displayCount, setDisplayCount] = useState(24);

  const filteredProjects = useMemo(() => {
    let list = projects;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.apartment_name?.toLowerCase().includes(q) ||
          p.developer_name?.toLowerCase().includes(q) ||
          p.locality?.toLowerCase().includes(q) ||
          p.project_id?.toLowerCase().includes(q)
      );
    }

    if (selectedLocality !== 'All Localities') {
      list = list.filter((p) => p.locality?.toLowerCase() === selectedLocality.toLowerCase());
    }

    if (selectedStatus !== 'All') {
      list = list.filter((p) => p.project_status?.toLowerCase() === selectedStatus.toLowerCase());
    }

    return list;
  }, [projects, search, selectedLocality, selectedStatus]);

  const visibleProjects = filteredProjects.slice(0, displayCount);

  return (
    <div id="projects-view">
      <div className="view-header">
        <div className="view-headline">
          <div>
            <h1 className="view-title">Builder Projects</h1>
            <p className="view-subtitle">
              Explore {filteredProjects.length} major residential developments across Bangalore with normalized INR pricing
            </p>
          </div>

          <div
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: '#a5b4fc',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} />
            <span>
              <strong>Costliest Project:</strong> P10255 (Puravankara Vista) — ₹4.89 Cr (Q7)
            </span>
          </div>
        </div>

        {/* Filter Card */}
        <div className="filter-card">
          <div className="filter-row">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                id="projects-search-input"
                className="input-field"
                placeholder="Search projects by name, developer, project ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              id="projects-filter-locality"
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
              {['All', 'under construction', 'ready to move'].map((st) => (
                <button
                  key={st}
                  id={`projects-status-${st.replace(/\s+/g, '-')}`}
                  className={`pill-btn ${selectedStatus === st ? 'active' : ''}`}
                  onClick={() => setSelectedStatus(st)}
                >
                  {st === 'All' ? 'All Status' : st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="cards-grid" id="projects-cards-grid">
        {visibleProjects.map((project) => {
          const isCostliest = project.project_id === 'P10255';
          return (
            <article
              key={project.project_id}
              className="property-card"
              id={`project-card-${project.project_id}`}
              style={isCostliest ? { border: '1px solid var(--accent-indigo)', boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)' } : {}}
            >
              <div className="card-header-img" style={{ height: '170px' }}>
                <img
                  src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80"
                  alt={project.apartment_name}
                  className="card-img-placeholder"
                  loading="lazy"
                />
                <div className="badge-overlay">
                  <span className="tag-badge tag-bhk" style={{ textTransform: 'capitalize' }}>
                    {project.project_status}
                  </span>
                  {isCostliest && (
                    <span className="tag-badge" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff' }}>
                      ★ Costliest Project (Q7)
                    </span>
                  )}
                </div>
              </div>

              <div className="card-body">
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'uppercase' }}>
                    {project.developer_name}
                  </div>
                  <h3 className="card-title" style={{ fontSize: '18px' }}>
                    {project.apartment_name}
                  </h3>
                  <div className="card-locality" style={{ textTransform: 'capitalize' }}>
                    <MapPin size={13} color="var(--accent-emerald)" />
                    <span>{project.locality}, Bangalore</span>
                    <span style={{ color: 'var(--text-muted)' }}>• {project.project_id}</span>
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Price Range (INR Corrected)
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-heading)' }}>
                    {formatProjectPrice(project.price_min, project.price_max)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Unit Sizes: {project.min_area_sqft} – {project.max_area_sqft} sq.ft
                  </div>
                </div>

                <div className="card-specs">
                  <div className="spec-item" title="Towers and Floors">
                    <Layers size={14} color="var(--text-muted)" />
                    <span>{project.total_towers} Towers, {project.total_floors} Fl</span>
                  </div>
                  <div className="spec-item" title="Total Units">
                    <Building2 size={14} color="var(--text-muted)" />
                    <span>{project.total_units} Units</span>
                  </div>
                  <div className="spec-item" title="Available Listings">
                    <span style={{ color: 'var(--accent-emerald)' }}>● {project.total_listings} Listings</span>
                  </div>
                </div>

                {project.amenities && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                    {project.amenities.slice(0, 4).map((amenity) => (
                      <span
                        key={amenity}
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(255,255,255,0.04)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {amenity}
                      </span>
                    ))}
                    {project.amenities.length > 4 && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        +{project.amenities.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>Possession: {project.possession_date || 'N/A'}</span>
                  {project.rera_number && (
                    <span title={`RERA: ${project.rera_number}`} style={{ color: 'var(--text-secondary)' }}>
                      RERA Verified
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {visibleProjects.length < filteredProjects.length && (
        <div style={{ textAlign: 'center', marginTop: '36px' }}>
          <button
            className="btn-secondary"
            style={{ padding: '12px 28px', fontSize: '14px' }}
            onClick={() => setDisplayCount((prev) => prev + 24)}
          >
            <span>Load More Projects ({filteredProjects.length - visibleProjects.length} remaining)</span>
          </button>
        </div>
      )}
    </div>
  );
}
