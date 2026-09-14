import json
from datetime import datetime, timezone, timedelta
from collections import Counter

with open('data/listings.json', 'r', encoding='utf-8') as f:
    listings = json.load(f)

with open('data/rentals.json', 'r', encoding='utf-8') as f:
    rentals = json.load(f)

with open('data/projects.json', 'r', encoding='utf-8') as f:
    projects = json.load(f)

print("=== QUESTION 5: total_monthly_rent in Whitefield ===")
# Assigned locality: 'whitefield'
whitefield_rentals = [r for r in rentals if r.get('locality', '').lower().strip() == 'whitefield']
print(f"Total rental records in whitefield: {len(whitefield_rentals)}")

# Inspect prices and deposits
rent_prices = [r.get('price') for r in whitefield_rentals]
print(f"Rent prices in Whitefield: min={min(rent_prices)}, max={max(rent_prices)}, sample={rent_prices[:10]}")

total_rent = sum(rent_prices)
print(f"Sum of monthly rent: {total_rent}")

# Check if any have null, 0, or negative price
anomalous_rent = [r for r in whitefield_rentals if r.get('price', 0) <= 0]
print(f"Anomalous rent records (price <= 0): {len(anomalous_rent)}")

# Check across ALL localities in rentals
all_rent_locs = Counter([r.get('locality') for r in rentals])
print(f"Rentals by locality: {all_rent_locs}")


print("\n=== QUESTION 7: costliest_project ===")
# "The project with the highest maximum price, as {"project_id": ..., "price_max_inr": ...}."
# Check price_max for all projects
projects_with_price = []
for p in projects:
    p_id = p.get('project_id')
    p_max = p.get('price_max')
    p_min = p.get('price_min')
    projects_with_price.append((p_max, p_id, p_min, p))

projects_with_price.sort(key=lambda x: x[0], reverse=True)
print("Top 5 costliest projects by price_max:")
for p_max, p_id, p_min, p in projects_with_price[:5]:
    print(f"  Project ID: {p_id} | price_max: {p_max} | price_min: {p_min} | name: {p.get('apartment_name')} | dev: {p.get('developer_name')}")

costliest = projects_with_price[0]
print(f"Costliest project answer: {{\"project_id\": \"{costliest[1]}\", \"price_max_inr\": {costliest[0]}}}")


print("\n=== QUESTION 8: listings_last_7_days ===")
# "How many retrievable listing records were posted in the seven days before REFERENCE, i.e. in [REFERENCE - 7 days, REFERENCE), in IST? REFERENCE = 2026-09-10T00:00:00+05:30 (IST)"
# REFERENCE = 2026-09-10T00:00:00+05:30
# REFERENCE - 7 days = 2026-09-03T00:00:00+05:30
# Note: In IST, [2026-09-03T00:00:00+05:30, 2026-09-10T00:00:00+05:30)
# In UTC, 2026-09-10T00:00:00+05:30 is 2026-09-09T18:30:00Z
# And 2026-09-03T00:00:00+05:30 is 2026-09-02T18:30:00Z

# Let's inspect posted_at in listings!
# Does posted_at have 'Z', '+05:30', or naive timestamp?
posted_samples = [l.get('posted_at') for l in listings[:20] if l.get('posted_at')]
print("Sample posted_at strings:", posted_samples[:5])

# Let's check timezone format across all listings
has_z = sum(1 for l in listings if 'Z' in (l.get('posted_at') or ''))
has_offset = sum(1 for l in listings if '+' in (l.get('posted_at') or '') or ('-' in (l.get('posted_at') or '')[10:]))
no_tz = sum(1 for l in listings if l.get('posted_at') and 'Z' not in l['posted_at'] and '+' not in l['posted_at'] and '-' not in l['posted_at'][10:])
print(f"Timezone formats: has_z={has_z}, has_offset={has_offset}, naive (no_tz)={no_tz}")

# If naive, is the server clock in Asia/Kolkata (+05:30)?
# Remember /health returned: "timezone": "Asia/Kolkata", "server_time": "...+05:30"
# And doc claimed: "ISO 8601, UTC, Z suffix, everywhere in the API" - which was false!
# Let's count both if naive is interpreted as IST, and if naive was UTC!
ref_ist_end = datetime(2026, 9, 10, 0, 0, 0)
ref_ist_start = datetime(2026, 9, 3, 0, 0, 0)

count_naive_ist = 0
for l in listings:
    p = l.get('posted_at')
    if p:
        # strip any Z or tz if present to parse
        dt = datetime.fromisoformat(p.replace('Z', ''))
        if ref_ist_start <= dt < ref_ist_end:
            count_naive_ist += 1
print(f"Listings in [2026-09-03, 2026-09-10) naive IST: {count_naive_ist}")


print("\n=== QUESTION 10: projects_with_wrong_listing_count ===")
# "Every project reports how many listings it has. For how many projects is that number wrong?"
# The documentation claimed:
# "total_listings is the number of listings currently available in the project. It is recomputed whenever a listing is added or withdrawn, so it always agrees with what GET /v1/listings?project_id=... returns."

# Count listings per project_id in our retrievable listings
listings_per_project = Counter([l.get('project_id') for l in listings if l.get('project_id')])
print(f"Distinct projects linked in listings: {len(listings_per_project)}")

# Compare each project's total_listings with actual count in listings
wrong_count = 0
right_count = 0
discrepancies = []
for p in projects:
    pid = p['project_id']
    reported = p.get('total_listings', 0)
    actual = listings_per_project.get(pid, 0)
    if reported != actual:
        wrong_count += 1
        discrepancies.append((pid, reported, actual))
    else:
        right_count += 1

print(f"Projects with wrong total_listings: {wrong_count}")
print(f"Projects with right total_listings: {right_count}")
print(f"Total projects evaluated: {len(projects)}")
print("Sample discrepancies (project_id, reported, actual):", discrepancies[:10])

# Also check live listings only per project
live_listings_per_project = Counter([l.get('project_id') for l in listings if l.get('project_id') and l.get('is_live') is True])
wrong_live_count = sum(1 for p in projects if p.get('total_listings', 0) != live_listings_per_project.get(p['project_id'], 0))
print(f"If comparing against ONLY live listings: wrong count = {wrong_live_count}")
