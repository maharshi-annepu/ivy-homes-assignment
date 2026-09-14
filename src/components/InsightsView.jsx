import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Database, CheckCircle2, ChevronRight, FileSearch, Sparkles, MapPin, Building, Info } from 'lucide-react';
import { formatINR } from '../services/api';
import findingsData from '../data/findings.json';

export default function InsightsView({ listings, rentals, projects }) {
  const [activeSubTab, setActiveSubTab] = useState('summary');
  const [filterCategory, setFilterCategory] = useState('All');

  // Compute /v1/analytics/summary aggregates as promised in documentation
  const analytics = useMemo(() => {
    const live = listings.filter((l) => l.is_live === true && l.price > 0 && l.carpet_area > 0);
    const prices = live.map((l) => l.price).sort((a, b) => a - b);
    const medianPrice = prices.length ? prices[Math.floor(prices.length / 2)] : 0;

    const rates = live.map((l) => {
      let c = l.carpet_area;
      if (l.website === 'magichomes' && c < 300) c *= 10.7639;
      return l.price / c;
    }).sort((a, b) => a - b);
    const medianRate = rates.length ? rates[Math.floor(rates.length / 2)] : 0;

    // Locality breakdown
    const locMap = {};
    live.forEach((l) => {
      const loc = l.locality?.toLowerCase().trim() || 'unknown';
      if (!locMap[loc]) locMap[loc] = [];
      locMap[loc].push(l);
    });

    const byLocality = Object.entries(locMap).map(([loc, items]) => {
      const pSorted = items.map((x) => x.price).sort((a, b) => a - b);
      const rSorted = items.map((x) => {
        let c = x.carpet_area;
        if (x.website === 'magichomes' && c < 300) c *= 10.7639;
        return x.price / c;
      }).sort((a, b) => a - b);

      return {
        locality: loc,
        count: items.length,
        median_price: pSorted[Math.floor(pSorted.length / 2)] || 0,
        median_rate: Math.round(rSorted[Math.floor(rSorted.length / 2)] || 0),
      };
    }).sort((a, b) => b.count - a.count);

    // BHK breakdown
    const bhkMap = {};
    live.forEach((l) => {
      const b = l.bedroom || 0;
      bhkMap[b] = (bhkMap[b] || 0) + 1;
    });
    const byBhk = Object.entries(bhkMap).map(([b, count]) => ({
      bedroom: parseInt(b, 10),
      count,
    })).sort((a, b) => a.bedroom - b.bedroom);

    return {
      total_listings: listings.length,
      active_listings: live.length,
      inactive_listings: listings.length - live.length,
      median_price: medianPrice,
      median_price_per_sqft: Math.round(medianRate),
      by_locality: byLocality,
      by_bhk: byBhk,
    };
  }, [listings]);

  const categories = ['All', ...new Set(findingsData.map((f) => f.category))];

  const filteredFindings = useMemo(() => {
    if (filterCategory === 'All') return findingsData;
    return findingsData.filter((f) => f.category === filterCategory);
  }, [filterCategory]);

  return (
    <div id="insights-view">
      <div className="view-header">
        <div className="view-headline">
          <div>
            <h1 className="view-title">Property Intelligence & Audit Insights</h1>
            <p className="view-subtitle">
              Interactive analytics synthesized from 4,700 catalog listings, 1,900 rentals, and 520 builder projects
            </p>
          </div>

          <div className="pill-group" id="insights-subtabs">
            <button
              className={`pill-btn ${activeSubTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('summary')}
            >
              <BarChart3 size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Market Aggregates (/v1/analytics)
            </button>
            <button
              className={`pill-btn ${activeSubTab === 'answers' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('answers')}
            >
              <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '6px' }} />
              The 10 Assignment Answers
            </button>
            <button
              className={`pill-btn ${activeSubTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('audit')}
            >
              <FileSearch size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Documentation Audit (19 Findings)
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'summary' && (
        <div>
          {/* Top Metric Cards */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Total Catalog Listings</div>
              <div className="metric-value">{analytics.total_listings.toLocaleString('en-IN')}</div>
              <div className="metric-footer">
                ● {analytics.active_listings.toLocaleString('en-IN')} Active • {analytics.inactive_listings} Inactive
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Median Sale Price</div>
              <div className="metric-value">{formatINR(analytics.median_price)}</div>
              <div className="metric-footer">Bangalore Metropolitan Area</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Median Rate / Sq.Ft</div>
              <div className="metric-value">₹{analytics.median_price_per_sqft.toLocaleString('en-IN')}</div>
              <div className="metric-footer">Normalized to square feet</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Builder Projects Tracked</div>
              <div className="metric-value">{projects.length}</div>
              <div className="metric-footer">517 active linked developments</div>
            </div>
          </div>

          {/* Locality Breakdown Table */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '24px' }}>
            <div className="audit-table-card">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', color: '#fff' }}>Market Trends by Locality</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Top Bangalore hubs</span>
              </div>
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Locality</th>
                    <th>Active Homes</th>
                    <th>Median Price</th>
                    <th>Rate / Sq.Ft</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.by_locality.slice(0, 10).map((loc) => (
                    <tr key={loc.locality}>
                      <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        <MapPin size={12} color="var(--accent-emerald)" style={{ display: 'inline', marginRight: '6px' }} />
                        {loc.locality}
                      </td>
                      <td>{loc.count.toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatINR(loc.median_price)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>₹{loc.median_rate.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* BHK Distribution */}
            <div className="audit-table-card">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', color: '#fff' }}>BHK Configuration Breakdown</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Inventory share</span>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {analytics.by_bhk.map((item) => {
                  const pct = Math.round((item.count / analytics.active_listings) * 100);
                  const label = item.bedroom === 0 ? 'Plot / Land' : `${item.bedroom} BHK`;
                  return (
                    <div key={item.bedroom}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{label}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {item.count.toLocaleString('en-IN')} units ({pct}%)
                        </span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: item.bedroom === 2 ? 'var(--accent-emerald)' : item.bedroom === 3 ? 'var(--accent-indigo)' : 'var(--accent-cyan)',
                            borderRadius: 'var(--radius-full)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'answers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
          {[
            {
              id: 'q1',
              num: 1,
              title: 'Total Listing Records',
              key: 'total_listing_records',
              val: '4,700',
              desc: 'Discovered that reported total (4348) was wrong; paging continues until has_more is false at offset 4700.',
            },
            {
              id: 'q2',
              num: 2,
              title: 'Unique Physical Properties',
              key: 'unique_properties',
              val: '4,350',
              desc: 'Exact physical deduplication (same apartment, locality, floor, bedroom) across cross-portal duplicate listings.',
            },
            {
              id: 'q3',
              num: 3,
              title: 'Active Live Listings',
              key: 'active_listings',
              val: '3,722',
              desc: 'Records with is_live=true. Document claimed inactive listings were excluded, but 978 inactive listings exist.',
            },
            {
              id: 'q4',
              num: 4,
              title: 'Corrupt Listing Records',
              key: 'corrupt_listing_ids',
              val: '24 IDs',
              desc: 'Records describing physically impossible entities (floor > total floors, carpet > super built-up, negative price).',
            },
            {
              id: 'q5',
              num: 5,
              title: 'Whitefield Total Monthly Rent',
              key: 'total_monthly_rent',
              val: '₹71,58,600',
              desc: 'Sum of monthly rent across all 206 rental records in assigned locality Whitefield.',
            },
            {
              id: 'q6',
              num: 6,
              title: 'Avg Price/Sq.Ft (2 BHK Live)',
              key: 'avg_price_per_sqft_2bhk',
              val: '₹11,496.44',
              desc: 'Mean price/sqft across genuine live 2BHKs, converting MagicHomes square meters to sqft. (Raw unadjusted: ₹21,033.07).',
            },
            {
              id: 'q7',
              num: 7,
              title: 'Costliest Builder Project',
              key: 'costliest_project',
              val: 'P10255 (₹4.89 Cr)',
              desc: 'Puravankara Vista (P10255) with max price 4.89 Crores = ₹4,89,00,000 INR. (P10068 is 99.8 Lakhs = ₹99.8L).',
            },
            {
              id: 'q8',
              num: 8,
              title: 'Listings in Last 7 Days',
              key: 'listings_last_7_days',
              val: '149',
              desc: 'Records posted in [2026-09-03, 2026-09-10) before fixed reference date in IST.',
            },
            {
              id: 'q9',
              num: 9,
              title: 'Fake Enquiry Listings',
              key: 'fake_listing_ids',
              val: '8 IDs',
              desc: 'Listings posted with token prices (₹6,250 – ₹16,790) equal to sqft rates to harvest buyer leads.',
            },
            {
              id: 'q10',
              num: 10,
              title: 'Projects with Wrong Count',
              key: 'projects_with_wrong_listing_count',
              val: '127',
              desc: 'Projects whose total_listings disagrees with actual available live listings (127 wrong, 393 exact matches).',
            },
          ].map((card) => (
            <div key={card.id} className="metric-card" style={{ gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                  Question #{card.num}
                </span>
                <code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{card.key}</code>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{card.val}</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{card.title}</div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'audit' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Filter Category:</span>
              <div className="pill-group">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`pill-btn ${filterCategory === cat ? 'active' : ''}`}
                    onClick={() => setFilterCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Showing {filteredFindings.length} of {findingsData.length} verified discrepancies
            </span>
          </div>

          <div className="audit-table-card">
            <table className="audit-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Category</th>
                  <th style={{ width: '180px' }}>Endpoint</th>
                  <th>Documented Claim</th>
                  <th>Actual API Behavior</th>
                  <th>Reproduction / How Found</th>
                  <th>Impact</th>
                </tr>
              </thead>
              <tbody>
                {filteredFindings.map((f, i) => (
                  <tr key={i}>
                    <td>
                      <span className="category-tag">{f.category}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-cyan)' }}>
                      {f.endpoint}
                    </td>
                    <td style={{ color: '#fda4af', fontSize: '13px' }}>{f.documented}</td>
                    <td style={{ color: '#86efac', fontSize: '13px' }}>{f.actual}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{f.how_found}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{f.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
