import json
import urllib.request
import urllib.parse

API_KEY = 'IVY26-336B8CC469F8'
BASE_URL = 'https://solve.ivy.homes'

findings = []

# Finding 1: API Key auth via query parameter vs header
# Doc: GET /v1/listings?api_key=IVY26-XXXXXXXXXXXX
# Actual: 401 "send your key in the X-API-Key request header, not as a query parameter"
findings.append({
    "endpoint": "*",
    "category": "auth",
    "documented": "Every request must carry the API key appended as a query parameter: ?api_key=IVY26-XXXXXXXXXXXX",
    "actual": "API key in query parameter returns 401; the API strictly requires the API key in the 'X-API-Key' request header.",
    "how_found": "Attempted GET /v1/listings?api_key=... and received HTTP 401 with message 'send your key in the X-API-Key request header, not as a query parameter'.",
    "impact": "All requests following the documentation fail with 401 Unauthorized.",
    "evidence": []
})

# Finding 2: Login response and token expiration / refresh flow
# Doc: returns {"token": "...", "expires_in": 86400}. "Tokens are valid for 24 hours... There is no refresh flow."
# Actual: returns access_token, refresh_token, expires_in=900 (15 mins), refresh_url=/auth/refresh.
findings.append({
    "endpoint": "/auth/login",
    "category": "auth",
    "documented": "POST /auth/login returns token with expires_in 86400 (24 hours). There is no refresh flow.",
    "actual": "Returns 'access_token' and 'refresh_token' with expires_in 900 (15 minutes). POST /auth/refresh exists and must be used to refresh the session.",
    "how_found": "Inspected POST /auth/login response body and verified POST /auth/refresh with the refresh_token.",
    "impact": "Frontend sessions die after 15 minutes instead of 24 hours unless the undocumented refresh endpoint is used.",
    "evidence": []
})

# Finding 3: Pagination query parameters
# Doc: "Every collection endpoint takes page and limit. page: int 1 1-indexed. limit: int 20 Maximum 200"
# Actual: The API uses offset and limit. The page parameter is ignored. Maximum limit is capped at 50, not 200.
findings.append({
    "endpoint": "*",
    "category": "pagination",
    "documented": "Every collection endpoint takes page (1-indexed) and limit (max 200).",
    "actual": "Collection endpoints use limit and offset. The 'page' query parameter is quietly ignored, and the maximum limit is capped at 50 instead of 200.",
    "how_found": "Tested page=2 and saw offset remained 0; requested limit=200 and received response with limit=50.",
    "impact": "Clients attempting page-based pagination stay on offset 0 forever, and requesting >50 records returns only 50.",
    "evidence": []
})

# Finding 4: Pagination response envelope
# Doc: { "total": 1240, "page": 1, "page_size": 20, "results": [ ... ] }
# Actual: { "limit": 20, "offset": 0, "count": 20, "total": ..., "has_more": true, "results": [ ... ] }
findings.append({
    "endpoint": "*",
    "category": "pagination",
    "documented": "Collection responses are shaped with total, page, page_size, results.",
    "actual": "Response envelope does not contain 'page' or 'page_size'; it contains 'limit', 'offset', 'count', 'total', 'has_more', 'results'.",
    "how_found": "Inspected JSON keys of collection endpoints.",
    "impact": "Code parsing response['page'] or response['page_size'] raises KeyError.",
    "evidence": []
})

# Finding 5: Total count in pagination
# Doc: "total is the exact number of records matching your filters. To fetch every record, read total, divide by your limit, and request that many pages."
# Actual: total reports 4348 for /v1/listings, but 4700 records exist and are retrievable by paging until has_more is false.
findings.append({
    "endpoint": "/v1/listings",
    "category": "completeness",
    "documented": "total is the exact number of records matching your filters. To fetch every record, read total, divide by your limit, and request that many pages.",
    "actual": "The reported total on /v1/listings is 4348, but the endpoint actually returns 4700 records before has_more becomes false.",
    "how_found": "Paged past offset 4348 and continued receiving records until offset 4700.",
    "impact": "Clients dividing reported total by limit miss 352 listing records.",
    "evidence": ["ZER-1002811", "DWE-1000590", "ZER-1001172", "SQU-1000301", "ZER-1004542", "SQU-1000906"]
})

# Finding 6: Single listing endpoint path
# Doc: GET /v1/listing/{id}
# Actual: GET /v1/listing/{id} returns 404; actual path is GET /v1/listings/{id} (plural).
findings.append({
    "endpoint": "/v1/listing/{id}",
    "category": "missing_endpoint",
    "documented": "GET /v1/listing/{id} fetches a single listing.",
    "actual": "GET /v1/listing/{id} returns 404 Not Found. The endpoint is plural: GET /v1/listings/{id}.",
    "how_found": "Sent GET request to /v1/listing/MAG-1002627 (got 404) and /v1/listings/MAG-1002627 (got 200).",
    "impact": "Listing detail views fail with 404 if using the documented singular path.",
    "evidence": []
})

# Finding 7: Comparables endpoint
# Doc: GET /v1/listings/ (Up to ten comparable listings — same locality, same bedroom count, price within 15%)
# Actual: GET /v1/listings/{id}/comparables or similar does not exist; returns 404.
findings.append({
    "endpoint": "/v1/listings/{id}/comparables",
    "category": "missing_endpoint",
    "documented": "GET /v1/listings/ (or comparables) returns up to ten comparable listings.",
    "actual": "Endpoint returns 404 Not Found; no server-side comparables endpoint exists.",
    "how_found": "Probed /v1/listings/{id}/comparables, /v1/listings/{id}/similar, and /v1/listing/{id}/comparables; all returned 404.",
    "impact": "Detail page 'you may also like' comparables must be computed client-side.",
    "evidence": []
})

# Finding 8: Favourites vs Saved endpoints
# Doc: GET /v1/favourites, POST /v1/favourites with {"id": "..."}, DELETE /v1/favourites/{id}
# Actual: All /v1/favourites endpoints return 404. The actual endpoint is /v1/saved, and POST requires body {"listing_id": "..."}.
findings.append({
    "endpoint": "/v1/favourites",
    "category": "missing_endpoint",
    "documented": "Saved listings managed at GET, POST, DELETE /v1/favourites with body {'id': '...'}.",
    "actual": "/v1/favourites returns 404. The actual resource is /v1/saved, and POST /v1/saved requires {'listing_id': '...'}.",
    "how_found": "Queried /v1/favourites (404), discovered /v1/saved (200), and verified schema validation error requiring 'listing_id'.",
    "impact": "Saving or retrieving favourite listings fails with 404 or 422.",
    "evidence": []
})

# Finding 9: Analytics summary endpoint
# Doc: GET /v1/analytics/summary
# Actual: Returns 404 Not Found.
findings.append({
    "endpoint": "/v1/analytics/summary",
    "category": "missing_endpoint",
    "documented": "GET /v1/analytics/summary returns pre-computed aggregates for your city.",
    "actual": "GET /v1/analytics/summary returns 404 Not Found; no analytics or insights endpoint exists on the server.",
    "how_found": "Sent GET request to /v1/analytics/summary and related variants; all returned 404.",
    "impact": "Insights screen metrics must be calculated from listings and rental data directly.",
    "evidence": []
})

# Finding 10: Sorting order parameter ignored
# Doc: "sort_by: price, carpet_area, posted_at, bedroom; order: asc (default) or desc"
# Actual: The order parameter is ignored. Specifying order=desc returns identical order to order=asc.
findings.append({
    "endpoint": "/v1/listings",
    "category": "sorting",
    "documented": "GET /v1/listings accepts sort_by and order (asc or desc).",
    "actual": "The 'order' query parameter is ignored by the server. Requesting order=desc returns records in the same order as order=asc.",
    "how_found": "Queried with sort_by=price&order=desc and sort_by=price&order=asc; both returned identical records in ascending order.",
    "impact": "Frontend cannot rely on the server for descending sorting.",
    "evidence": []
})

# Finding 11: project_id filter parameter ignored on listings
# Doc: "total_listings ... always agrees with what GET /v1/listings?project_id=... returns."
# Actual: Query parameter project_id on /v1/listings is completely ignored and returns unfiltered listings.
findings.append({
    "endpoint": "/v1/listings",
    "category": "filters",
    "documented": "GET /v1/listings?project_id=... filters listings by project_id.",
    "actual": "The project_id query parameter is ignored on GET /v1/listings and returns all listings unfiltered.",
    "how_found": "Requested GET /v1/listings?project_id=P10001 and received total: 4348 with listings from unrelated projects.",
    "impact": "Filtering listings by project must be done client-side.",
    "evidence": ["100-1002089", "MAG-1002627", "SQU-1003847"]
})

# Finding 12: Timestamp format and timezone
# Doc: "Timestamps: ISO 8601, UTC, Z suffix, everywhere in the API"
# Actual: Timestamps in listing records (posted_at) have no 'Z' suffix and no timezone offset. /health has explicit '+05:30' offset.
findings.append({
    "endpoint": "/v1/listings",
    "category": "timestamps",
    "documented": "Timestamps are ISO 8601, UTC, with Z suffix everywhere in the API.",
    "actual": "Listing posted_at values are local naive ISO 8601 timestamps without 'Z' suffix or timezone offset (e.g., '2026-06-15T02:33:00').",
    "how_found": "Inspected posted_at field across all 4700 listing records; zero records contain 'Z'.",
    "impact": "Parsers expecting strict UTC with Z suffix fail or misinterpret the timestamps.",
    "evidence": ["MAG-1002627", "100-1000042", "R1000001", "DWE-1001129"]
})

# Finding 13: Project prices in Lakhs/Crores instead of Rupees
# Doc: "Money: Indian rupees, integer, everywhere in the API. price_min and price_max are in rupees."
# Actual: In /v1/projects, price_min and price_max are floats expressed in Lakhs (if <100) or Crores (if <10).
findings.append({
    "endpoint": "/v1/projects",
    "category": "units",
    "documented": "price_min and price_max are in Indian rupees, integer, everywhere in the API.",
    "actual": "In /v1/projects, price_min and price_max are floating point values denominated in Crores (for values < 10) or Lakhs (for values >= 10), not integer rupees.",
    "how_found": "Observed project price_max values like 2.95 (Crores) and 99.8 (Lakhs), while individual listings have prices in tens of millions of rupees.",
    "impact": "Displaying raw values directly results in absurd project prices (e.g. 2 rupees instead of 2.95 Crores).",
    "evidence": ["P10001", "P10002", "P10004", "P10068", "P10255"]
})

# Finding 14: Carpet area unit discrepancy in MagicHomes
# Doc: "Area: Square feet, integer, everywhere in the API"
# Actual: For MagicHomes listings (website: 'magichomes'), carpet_area under 300 is given in square meters, not square feet.
findings.append({
    "endpoint": "/v1/listings",
    "category": "units",
    "documented": "Area is in square feet, integer, everywhere in the API.",
    "actual": "In MagicHomes listings, carpet_area and super_built_up_area for apartments are given in square meters (values ~35-150) rather than square feet.",
    "how_found": "Found 389 MagicHomes listings with carpet_area < 300, matching standard Indian 1-4 BHK square meter dimensions (e.g. 77 sqm for a 2 BHK).",
    "impact": "Price per square foot calculations are inflated tenfold (~180,000 INR/sqft) unless converted (* 10.7639) to square feet.",
    "evidence": ["MAG-1000658", "MAG-1001407", "MAG-1002627", "MAG-1000459", "MAG-1001162"]
})

# Finding 15: Inactive listings returned by /v1/listings
# Doc: "Returns active sale listings in your city. Inactive, expired and withdrawn listings are excluded server side, so anything this endpoint returns is safe to show to a user."
# Actual: Endpoint returns inactive listings (is_live: false). The response includes an undocumented 'is_live' boolean field.
findings.append({
    "endpoint": "/v1/listings",
    "category": "consistency",
    "documented": "Returns active sale listings in your city. Inactive, expired and withdrawn listings are excluded server side.",
    "actual": "Endpoint returns inactive listings with is_live=false (978 records out of 4700). The field 'is_live' is returned but undocumented.",
    "how_found": "Checked is_live across all 4700 listing records and found 978 records with is_live=false.",
    "impact": "Frontends displaying all listings without filtering on is_live will show inactive/withdrawn properties.",
    "evidence": ["100-1002600", "MAG-1000179", "ZER-1002911", "DWE-1001165", "100-1002442"]
})

# Finding 16: Duplicate listings for the same physical property
# Doc: "Every listing_id is globally unique, and each listing corresponds to exactly one physical property."
# Actual: 350 listing records are cross-portal duplicate listings describing the exact same physical property (same apartment, floor, bedrooms, and layout).
findings.append({
    "endpoint": "/v1/listings",
    "category": "duplicates",
    "documented": "Each listing corresponds to exactly one physical property.",
    "actual": "Multiple listing records describe the same physical property across different websites, differing only by broker contact and minor price/area rounding.",
    "how_found": "Identified 332 groups of listings sharing identical apartment_name, locality, floor, and bedroom count, containing 350 duplicate records.",
    "impact": "Users see redundant listings for the identical flat across different broker portals.",
    "evidence": ["DWE-1004037", "ZER-1003310", "100-1002466", "100-1004477", "SQU-1000295", "100-1004301"]
})

# Finding 17: Project total_listings disagreement
# Doc: "total_listings is the number of listings currently available in the project. It is recomputed whenever a listing is added or withdrawn, so it always agrees with what GET /v1/listings?project_id=... returns."
# Actual: total_listings on projects does not agree with the retrievable listings for 127 projects (when compared to live listings) or 392 projects (all listings).
findings.append({
    "endpoint": "/v1/projects",
    "category": "consistency",
    "documented": "total_listings is recomputed whenever a listing is added or withdrawn, so it always agrees with what GET /v1/listings?project_id=... returns.",
    "actual": "total_listings disagrees with the actual number of listings available in /v1/listings for 127 projects.",
    "how_found": "Counted live listings per project_id and compared with project.total_listings across all 520 projects.",
    "impact": "Project total_listings count is out of sync with actual listings catalog.",
    "evidence": ["P10003", "P10004", "P10005", "P10011", "P10012", "P10014", "P10015"]
})

# Finding 18: Impossible records (data quality)
# Doc: Implies real-world property listings.
# Actual: Listings exist with physically impossible attributes: floor > total_floors, carpet > super_built, and negative prices.
findings.append({
    "endpoint": "/v1/listings",
    "category": "data_quality",
    "documented": "Valid real estate sale listings describing physical properties.",
    "actual": "Contains records with physically impossible data: floors exceeding total building floors (e.g. floor 40 of 25), carpet area exceeding super built-up area, and negative sale prices.",
    "how_found": "Audited physical constraints across all 4700 records: found 8 floor-exceeding records, 8 carpet-exceeding records, and 8 negative-price records.",
    "impact": "Corrupts statistical metrics and breaks UI floor pickers and pricing displays.",
    "evidence": ["100-1002884", "MAG-1000179", "MAG-1003269", "100-1001077", "ZER-1002667", "100-1002346", "ZER-1001207"]
})

# Finding 19: Fake / lead generation listings (fraud)
# Doc: Implies genuine market listings.
# Actual: Exactly 8 listings have prices set to the per-sqft rate (e.g. 6250 - 16790 INR) to act as fake enquiry generators.
findings.append({
    "endpoint": "/v1/listings",
    "category": "fraud",
    "documented": "Genuine sale listings with authentic sale prices.",
    "actual": "Contains fake listings posted with suspiciously low token prices (6,250 to 16,790 INR, representing the sqft rate) designed to attract clicks and harvest enquiries.",
    "how_found": "Filtered listings with price < 1,000,000 INR; found exactly 8 records where total price was entered as the sqft rate.",
    "impact": "Misleads buyers and drastically skews price sort orders and averages.",
    "evidence": ["100-1002501", "DWE-1002631", "DWE-1003102", "MAG-1003492", "SQU-1001431", "SQU-1003524", "ZER-1003652", "ZER-1003813"]
})

print(f"Total verified findings: {len(findings)}")
with open('data/findings.json', 'w', encoding='utf-8') as f:
    json.dump(findings, f, indent=2)
print("Saved data/findings.json")
