// API Client for Ivy Homes Property Service

export const API_BASE_URL = 'https://solve.ivy.homes';
export const API_KEY = 'IVY26-336B8CC469F8';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('ivy_access_token') || null;
    this.refreshTokenVal = localStorage.getItem('ivy_refresh_token') || null;
    this.refreshTimer = null;

    if (this.token && this.refreshTokenVal) {
      this.startAutoRefresh();
    }
  }

  setSession(authData) {
    this.token = authData.access_token || authData.token;
    this.refreshTokenVal = authData.refresh_token || null;
    
    if (this.token) {
      localStorage.setItem('ivy_access_token', this.token);
    }
    if (this.refreshTokenVal) {
      localStorage.setItem('ivy_refresh_token', this.refreshTokenVal);
    }
    if (authData.user) {
      localStorage.setItem('ivy_user', JSON.stringify(authData.user));
    }
    this.startAutoRefresh();
  }

  clearSession() {
    this.token = null;
    this.refreshTokenVal = null;
    localStorage.removeItem('ivy_access_token');
    localStorage.removeItem('ivy_refresh_token');
    localStorage.removeItem('ivy_user');
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    // Token expires in 900s (15 min). Auto-refresh every 8 minutes (480,000ms)
    this.refreshTimer = setInterval(() => {
      this.refreshToken();
    }, 8 * 60 * 1000);
  }

  async refreshToken() {
    if (!this.refreshTokenVal) return null;
    try {
      const resp = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify({ refresh_token: this.refreshTokenVal }),
      });
      if (resp.ok) {
        const data = await resp.json();
        this.setSession(data);
        return data.access_token;
      } else {
        console.warn('Refresh token failed with status', resp.status);
      }
    } catch (err) {
      console.error('Error refreshing token:', err);
    }
    return null;
  }

  async request(path, options = {}, retryOn401 = true) {
    const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
    const headers = {
      'X-API-Key': API_KEY,
      ...(options.headers || {}),
    };

    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    let resp;
    try {
      resp = await fetch(url, { ...options, headers });
    } catch (err) {
      throw new Error(`Network error connecting to ${url}: ${err.message}`);
    }

    if (resp.status === 401 && retryOn401 && this.refreshTokenVal) {
      const newToken = await this.refreshToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        return this.request(path, { ...options, headers }, false);
      }
    }

    if (!resp.ok) {
      let errorDetail = `HTTP ${resp.status}`;
      try {
        const errJson = await resp.json();
        errorDetail = errJson.detail || JSON.stringify(errJson);
      } catch (e) {
        errorDetail = await resp.text();
      }
      const err = new Error(errorDetail);
      err.status = resp.status;
      throw err;
    }

    return resp.json();
  }

  // Auth Endpoints
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    this.setSession(data);
    return data;
  }

  async logout() {
    try {
      if (this.token) {
        await this.request('/auth/logout', { method: 'POST' });
      }
    } catch (e) {
      console.warn('Logout server notification failed:', e);
    } finally {
      this.clearSession();
    }
  }

  // Listings Endpoints
  async getListings(params = {}) {
    const query = new URLSearchParams();
    if (params.offset !== undefined) query.set('offset', params.offset);
    if (params.limit !== undefined) query.set('limit', params.limit);
    if (params.locality) query.set('locality', params.locality.toLowerCase());
    if (params.bhk) query.set('bhk', params.bhk);
    if (params.property_type) query.set('property_type', params.property_type);
    if (params.min_price) query.set('min_price', params.min_price);
    if (params.max_price) query.set('max_price', params.max_price);
    if (params.furnishing) query.set('furnishing', params.furnishing);

    const qs = query.toString();
    return this.request(`/v1/listings${qs ? `?${qs}` : ''}`);
  }

  async getListingDetail(id) {
    return this.request(`/v1/listings/${id}`);
  }

  // Rentals Endpoints
  async getRentals(params = {}) {
    const query = new URLSearchParams();
    if (params.offset !== undefined) query.set('offset', params.offset);
    if (params.limit !== undefined) query.set('limit', params.limit);
    if (params.locality) query.set('locality', params.locality.toLowerCase());
    if (params.bhk) query.set('bhk', params.bhk);
    const qs = query.toString();
    return this.request(`/v1/rentals${qs ? `?${qs}` : ''}`);
  }

  async getRentalDetail(id) {
    return this.request(`/v1/rentals/${id}`);
  }

  // Projects Endpoints
  async getProjects(params = {}) {
    const query = new URLSearchParams();
    if (params.offset !== undefined) query.set('offset', params.offset);
    if (params.limit !== undefined) query.set('limit', params.limit);
    if (params.locality) query.set('locality', params.locality.toLowerCase());
    const qs = query.toString();
    return this.request(`/v1/projects${qs ? `?${qs}` : ''}`);
  }

  async getProjectDetail(id) {
    return this.request(`/v1/projects/${id}`);
  }

  // Saved / Favourites Endpoints
  async getSaved() {
    return this.request('/v1/saved');
  }

  async addSaved(listingId) {
    return this.request('/v1/saved', {
      method: 'POST',
      body: { listing_id: listingId },
    });
  }

  async removeSaved(listingId) {
    return this.request(`/v1/saved/${listingId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();

// Utilities for formatting & unit corrections discovered in audit

export function formatINR(num) {
  if (num === null || num === undefined || isNaN(num)) return '₹0';
  if (num < 0) return `-₹${formatINR(Math.abs(num)).replace('₹', '')}`;
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2).replace(/\.00$/, '')} Lakh`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

export function formatProjectPrice(minVal, maxVal) {
  const toINR = (val) => {
    if (!val) return 0;
    // Discovered in audit: < 10 is Crores, >= 10 is Lakhs
    return val < 10 ? val * 10000000 : val * 100000;
  };
  const minINR = toINR(minVal);
  const maxINR = toINR(maxVal);
  return `${formatINR(minINR)} – ${formatINR(maxINR)}`;
}

export function getNormalizedCarpetArea(listing) {
  if (!listing) return { area: 0, isNormalized: false };
  const rawArea = listing.carpet_area || 0;
  // Discovered in audit: MagicHomes under 300 is square meters!
  if (listing.website === 'magichomes' && rawArea > 0 && rawArea < 300) {
    return {
      area: Math.round(rawArea * 10.7639),
      rawSqm: rawArea,
      isNormalized: true,
    };
  }
  return {
    area: rawArea,
    rawSqm: null,
    isNormalized: false,
  };
}
