import json
from collections import Counter
from datetime import datetime

with open('data/listings.json', 'r', encoding='utf-8') as f:
    listings = json.load(f)

with open('data/rentals.json', 'r', encoding='utf-8') as f:
    rentals = json.load(f)

with open('data/projects.json', 'r', encoding='utf-8') as f:
    projects = json.load(f)

print(f"Loaded records count: listings={len(listings)}, rentals={len(rentals)}, projects={len(projects)}")

# Check duplicate listing_ids
listing_ids = [l['listing_id'] for l in listings]
print(f"Total listing objects: {len(listing_ids)}, unique listing_ids: {len(set(listing_ids))}")
if len(listing_ids) != len(set(listing_ids)):
    counts = Counter(listing_ids)
    dups = [k for k, v in counts.items() if v > 1]
    print(f"Duplicate listing_ids count: {len(dups)}, sample: {dups[:5]}")

rental_ids = [r['listing_id'] for r in rentals]
print(f"Total rental objects: {len(rental_ids)}, unique rental_ids: {len(set(rental_ids))}")

proj_ids = [p['project_id'] for p in projects]
print(f"Total project objects: {len(proj_ids)}, unique project_ids: {len(set(proj_ids))}")
