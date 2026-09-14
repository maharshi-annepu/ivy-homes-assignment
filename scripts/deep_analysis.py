import json
import re
from datetime import datetime, timezone, timedelta
from collections import Counter, defaultdict
import math

with open('data/listings.json', 'r', encoding='utf-8') as f:
    listings = json.load(f)

with open('data/rentals.json', 'r', encoding='utf-8') as f:
    rentals = json.load(f)

with open('data/projects.json', 'r', encoding='utf-8') as f:
    projects = json.load(f)

print(f"Total listings: {len(listings)}")
print(f"Total rentals: {len(rentals)}")
print(f"Total projects: {len(projects)}")

# Question 1: total_listing_records
# "How many listing records are retrievable from /v1/listings?"
print(f"\n--- Q1: total_listing_records: {len(listings)}")

# Question 3: active_listings
# "How many retrievable listing records have is_live true?"
live_listings = [l for l in listings if l.get('is_live') is True]
print(f"\n--- Q3: active_listings: {len(live_listings)}")
is_live_vals = Counter([l.get('is_live') for l in listings])
print(f"is_live distribution: {is_live_vals}")

# Let's inspect potential corrupt listings (Question 4)
# What can be corrupt / cannot exist?
print("\n--- Investigating Corrupt Listings ---")
corrupt_candidates = []

for l in listings:
    lid = l['listing_id']
    issues = []
    
    # 1. Price <= 0
    if l.get('price', 0) <= 0:
        issues.append(f"negative_or_zero_price: {l.get('price')}")
        
    # 2. Floor > total_floors (except basement or ground if floor < 0?)
    floor = l.get('floor')
    total_floors = l.get('total_floors')
    if floor is not None and total_floors is not None:
        if floor > total_floors:
            issues.append(f"floor_exceeds_total: floor={floor} > total={total_floors}")
        if floor < 0:
            issues.append(f"negative_floor: floor={floor}")
            
    # 3. Area anomalies
    carpet = l.get('carpet_area', 0)
    super_built = l.get('super_built_up_area', 0)
    if carpet <= 0:
        issues.append(f"carpet_area <= 0: {carpet}")
    if super_built <= 0:
        issues.append(f"super_built_up_area <= 0: {super_built}")
    if carpet > 0 and super_built > 0 and carpet > super_built:
        issues.append(f"carpet > super_built: carpet={carpet} > super={super_built}")
        
    # 4. Bedrooms / Bathrooms
    bed = l.get('bedroom', 0)
    bath = l.get('bathroom', 0)
    if bed < 0:
        issues.append(f"negative_bedroom: {bed}")
    if bath < 0:
        issues.append(f"negative_bathroom: {bath}")
    if bed > 20: # unreasonable mansion in apartment?
        issues.append(f"extreme_bedroom: {bed}")
        
    # 5. Geolocation outside Bangalore/Earth
    lat = l.get('latitude', 0)
    lon = l.get('longitude', 0)
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        issues.append(f"invalid_lat_lon: {lat}, {lon}")
    # Bangalore is approx lat 12.7 to 13.3, lon 77.3 to 77.8
    if not (12.0 <= lat <= 14.0 and 76.5 <= lon <= 78.5):
        issues.append(f"lat_lon_far_from_bangalore: {lat}, {lon}")
        
    # 6. Dates in the future or crazy
    # Reference date is 2026-09-10
    posted = l.get('posted_at')
    if posted:
        try:
            dt = datetime.fromisoformat(posted.replace('Z', '+00:00'))
            if dt.year > 2026 or (dt.year == 2026 and dt.month > 9):
                issues.append(f"future_posted_at: {posted}")
            if dt.year < 2000:
                issues.append(f"ancient_posted_at: {posted}")
        except Exception as e:
            issues.append(f"invalid_date_format: {posted}")
            
    if issues:
        corrupt_candidates.append((lid, issues, l))

print(f"Total listings with issues: {len(corrupt_candidates)}")
issue_types = Counter()
for lid, issues, _ in corrupt_candidates:
    for iss in issues:
        issue_types[iss.split(':')[0]] += 1
print("Issue types summary:")
for k, v in issue_types.items():
    print(f"  {k}: {v}")

print("\nSample corrupt listings:")
for lid, issues, _ in corrupt_candidates[:15]:
    print(f"  {lid}: {issues}")

