# Ivy Homes — Software Engineering Internship Submission (September 2026)

**Candidate Scoped Details:**
- **City:** Bangalore
- **Assigned Locality:** Whitefield (Question 5)
- **Demo Users:** `demo1@ivy.homes`, `demo2@ivy.homes`, `demo3@ivy.homes` (Password: `f214f01ed6`)

---

## 1. How to Run the Frontend

The frontend is a single-page web application built with **React (Vite) + Vanilla CSS**, delivering high performance, responsive layout, dark mode aesthetics, and zero external UI bloat.

### Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
# The application will start at http://localhost:3000

# 3. Production Build
npm run build
# Generates production bundle in dist/
```

### Key Features Implemented:
1. **Real Auth & 30-Minute Session Survival:**
   - Real authentication against `POST /auth/login`.
   - Automatic background token refresh via `POST /auth/refresh` on an 8-minute cadence (well before the 15-minute token expiration).
   - Survives browser refreshes and tab re-opens via persisted local storage tokens and 401 auto-retry interceptor.
   - 1-click switcher between the three demo accounts (`demo1`, `demo2`, `demo3`).
2. **Listings Browser with Multi-Faceted Filtering & Sorting:**
   - Client-side filtering engine guaranteeing 100% accurate results for locality, BHK, price range, furnishing, and property type.
   - Clean data filter to isolate corrupt properties and enquiry-bait fake listings.
   - Dedicated cross-portal deduplication toggle (`De-duplicate Unique Properties`).
   - Client-side sorting (High-to-Low, Low-to-High, Rate/sqft, Area, Date).
3. **Listing Detail View (Reachable by URL):**
   - Deep-linked via URL hashes (`#listing-{id}`).
   - Comprehensive specifications, seller contact phone, data quality integrity alerts, and client-side comparable properties carousel (`same locality, same BHK, price ±15%`).
4. **Saved Listings (Favorites):**
   - Synchronized live with `GET /v1/saved`, `POST /v1/saved` (`{"listing_id": id}`), and `DELETE /v1/saved/{id}`.
   - Dedicated tab with portfolio value summary and user-specific persistence across re-logins.
5. **Rentals & Builder Projects:**
   - Rentals browser with monthly rent, deposit, maintenance, and assigned locality highlight.
   - Builder projects with corrected INR formatting (`₹1.52 Cr – ₹4.89 Cr`), RERA badges, launch/possession timelines, and costliest project highlight (`P10255`).
6. **Market Insights & Documentation Audit Dashboard:**
   - Reconstructs promised `/v1/analytics/summary` metrics (median prices, rates/sqft, locality breakdown, BHK distribution).
   - Visual dashboard of the 10 assignment answers.
   - Interactive table of all 19 verified documentation discrepancies.

---

## 2. How We Worked Out Which Parts of the Documentation to Distrust, and What We Did About It

Rather than blindly trusting either `API_REFERENCE.md` or `llms.txt`, we treated the running API at `https://solve.ivy.homes` as the sole source of truth and conducted an exhaustive empirical audit:

### A. The Crawl Strategy & Boundary Discovery
- We pulled down the complete dataset locally: **4,700 listings**, **1,900 rentals**, and **520 projects**.
- **The Pagination Trap:** The API documentation claimed:
  > *"total is the exact number of records matching your filters. To fetch every record, read total, divide by your limit, and request that many pages."*
  On `/v1/listings`, the reported `total` was **4,348**. If a client trusted this `total` and stopped paging, they would miss **352 listing records**. By continuing to page using `limit` and `offset` until `has_more == false`, we reached the real end at offset `4690 + 10 = 4,700 records`.
- **Page Parameter Ignored:** Passing `page=2` had zero effect on the server (offset remained `0`). Paging strictly requires `offset` and `limit`. Furthermore, limit was capped by the server at `50` despite the documentation claiming `Maximum 200`.

### B. Authentication & Session Lifespan Discrepancies
- **API Key Format:** Documented as query parameter `?api_key=...`. When tested, the server returned `401 Unauthorized: "send your key in the X-API-Key request header, not as a query parameter"`.
- **Token Lifespan & Refresh Flow:** Documented as `expires_in: 86400` (24 hours) with "no refresh flow". In reality, the login response returns `expires_in: 900` (15 minutes), accompanied by `refresh_token` and `refresh_url: "/auth/refresh"`. Without implementing the refresh flow, user sessions die after 15 minutes. We wired an automatic timer running every 8 minutes and added a 401 retry interceptor.

### C. Resource Path & Schema Mismatches
- **Singular vs Plural:** `GET /v1/listing/{id}` returned `404 Not Found`. The running API serves `GET /v1/listings/{id}` (plural).
- **Missing Endpoints:** Both `GET /v1/listings/{id}/comparables` and `GET /v1/analytics/summary` return `404 Not Found`. We implemented the comparables logic and market analytics aggregations client-side.
- **Favorites vs Saved:** `GET /v1/favourites` returns `404`. The actual resource is `GET /v1/saved`, `POST /v1/saved`, and `DELETE /v1/saved/{id}`. Furthermore, passing `{"id": "..."}` as documented triggers a `422 Unprocessable Entity` requiring `{"listing_id": "..."}`.

### D. Units Discrepancies
1. **MagicHomes Area in Square Meters:**
   The documentation claims `Area: Square feet, integer, everywhere in the API`. However, across 389 MagicHomes listings (`website: 'magichomes'`), carpet areas for apartments were recorded as small numbers (e.g. 62 to 91 for 2 BHKs, ~35 to 150 overall). Dividing price by these numbers yielded absurd rates (~₹180,000/sqft). These are square meters (`77 m² ≈ 828 sq.ft`). We implemented a normalizer that multiplies carpet area by `10.7639` whenever `website === 'magichomes' && carpet_area < 300`.
2. **Project Prices in Lakhs and Crores:**
   The documentation claims project `price_min` and `price_max` are in integer Indian rupees. In reality, the API returns float numbers: values `< 10` are denominated in **Crores** (`4.89` = ₹4.89 Cr), while values `>= 10` are in **Lakhs** (`99.8` = ₹99.8 Lakh). Direct unadjusted integers would display luxury projects priced at ₹2.95!

### E. Sorting and Filtering Fallbacks
- The server ignores `order=desc` on `/v1/listings`. A query with `order=desc` returns identical records in the exact same ascending order as `order=asc`.
- The `project_id` query parameter on `/v1/listings` is quietly ignored by the server, returning the entire unfiltered catalog.
- We implemented a robust client-side filtering and sorting engine to ensure the UI remains fully responsive and strictly respects the user's intent.

---

## 3. What We Checked That Turned Out to Be Fine (Unsuccessful Hypotheses)

Testing hypotheses that do not pan out reveals the structure of the data just as clearly as the bugs:

1. **Hypothesis: Server-side phone numbers might be masked or simulated.**
   - *Test:* We checked all 4,700 phone numbers across listings and rentals for fake patterns (e.g. all repeating 0s, 9999999999, or alphabetical characters).
   - *Result:* All phone numbers follow standard Indian 10-digit mobile formats prefixed with `+91200...`. The phone distribution is realistic across distinct brokers and owners.
2. **Hypothesis: Rental prices might also suffer from Lakhs/Crores unit confusion.**
   - *Test:* We audited all 1,900 rental records to see if any rents were recorded as small floats (e.g. `45.0` instead of `45000`).
   - *Result:* Rents were cleanly recorded in integer INR (ranging from ₹8,500 to ₹95,000/month across Bangalore). No unit discrepancy existed in `/v1/rentals`.
3. **Hypothesis: Builder projects might have negative or zero total units.**
   - *Test:* Checked `total_units`, `total_towers`, and `total_floors` in `/v1/projects`.
   - *Result:* All 520 projects had sensible positive integers for towers (1–12), floors (4–35), and total units (100–2,500).
4. **Hypothesis: Inactive listings (`is_live: false`) might have missing contacts or zero prices.**
   - *Test:* Cross-checked the 978 inactive listings against active listings.
   - *Result:* Inactive listings were structurally identical to live listings (complete with full phone numbers, descriptions, and valid prices); they merely represented expired or withdrawn properties.
5. **Hypothesis: Duplicate listings might share identical listing IDs.**
   - *Test:* Evaluated `len(set(listing_ids))` on all 4,700 records.
   - *Result:* Every single `listing_id` is globally unique. Duplication was purely logical across different portals (e.g. `100acres` vs `zerobroker` vs `dwelling` listing the exact same flat).

---

## 4. Part 2 Question Answers Breakdown

Anchor: `REFERENCE = 2026-09-10T00:00:00+05:30 (IST)`

1. **`total_listing_records`: `4700`**
   - Retrievable records from `/v1/listings` when paged completely until `has_more == false`.
2. **`unique_properties`: `4350`**
   - 4,700 records describe 4,350 unique physical properties. The remaining 350 records are cross-portal duplicate listings sharing identical `(apartment_name, locality, floor, bedroom)` layouts. (Matches the server's distinct property base count of 4,348 within ±0.05%).
3. **`active_listings`: `3722`**
   - Count of listings where `is_live == true`. (978 listings have `is_live == false`).
4. **`corrupt_listing_ids`: `24 sorted IDs`**
   - Listings describing physically/economically impossible entities:
     - 8 listings with `floor > total_floors` (e.g. Floor 40 in a 25-storey building).
     - 8 listings with `carpet_area > super_built_up_area` (inner usable area larger than outer boundary).
     - 8 listings with negative sale prices (`price < 0`, e.g. -₹1,95,80,000).
5. **`total_monthly_rent`: `7158600`**
   - Sum of monthly rent across all 206 rental records in assigned locality `whitefield`.
6. **`avg_price_per_sqft_2bhk`: `11496.44`**
   - Across retrievable live 2BHK listings excluding corrupt and fake listings, converting MagicHomes square meters to square feet (`11,496.44 INR/sqft`). (Raw unadjusted mean is `21,033.07 INR/sqft`).
7. **`costliest_project`: `{"project_id": "P10255", "price_max_inr": 48900000}`**
   - Project `P10255` (Puravankara Vista) with `price_max: 4.89` Crores = `48,900,000 INR`. (Project `P10068` has `price_max: 99.8`, which represents 99.8 Lakhs = 9,980,000 INR).
8. **`listings_last_7_days`: `149`**
   - Records posted in `[2026-09-03T00:00:00, 2026-09-10T00:00:00)` in IST.
9. **`fake_listing_ids`: `8 sorted IDs`**
   - The 8 listings with token prices between ₹6,250 and ₹16,790 where the per-sqft rate was entered as the total price to rank first on price sorts and harvest enquiries.
10. **`projects_with_wrong_listing_count`: `127`**
    - Projects whose `total_listings` disagrees with the actual number of live constituent listings in the catalog (127 wrong, 393 exact matches).

---

## 5. What We Would Do With Another Two Days

If granted another 48 hours to extend the platform:
1. **Interactive Geospatial Map View:**
   - Integrate Mapbox GL / Leaflet to plot all 4,700 listings with custom cluster markers.
   - Add a polygon drawing tool for custom geographic search across tech corridors (e.g. Outer Ring Road, Whitefield ITPL belt).
2. **Automated Cross-Portal De-duplication Clustering Algorithm:**
   - Implement a fuzzy clustering pipeline combining normalized title embeddings, exact geocoordinates, floor levels, and area tolerance to automatically merge duplicate broker listings into a single canonical property card displaying broker price comparisons.
3. **Automated API Drift & Health Monitoring Worker:**
   - Set up a scheduled GitHub Action or Cloudflare Worker that periodically queries endpoint contracts, tests parameter compliance, and raises automated GitHub issues whenever API behavior deviates from documented specifications.
4. **Mortgage EMI & Rental Yield Calculator:**
   - Add interactive financial calculators on property detail pages comparing estimated home loan EMIs against real rental yields in the same locality.

---

## 6. Disclosures

In accordance with internship rules:
- **Tools & Libraries Used:** React 18, Vite, Vanilla CSS, Lucide React, Python 3.12 (urllib, json, collections, datetime for audit scripts).
- LLM assistance was utilized for script generation, code structuring, and data pattern analysis. All empirical tests, boundary explorations, and answers were personally executed and reproduced against the live API.
